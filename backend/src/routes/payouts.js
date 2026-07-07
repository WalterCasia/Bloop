import Stripe from 'stripe';
import { config } from '../config/env.js';

// Inicializar Stripe si existe la llave
const stripe = config.stripeSecret ? new Stripe(config.stripeSecret, { apiVersion: '2023-10-16' }) : null;

/**
 * Rutas relacionadas a Pagos y Liquidaciones (Subcuentas Stripe Connect)
 */
export default async function payoutsRoutes(fastify, options) {
  
  // 1. Endpoint para iniciar el Onboarding o crear la subcuenta si no existe
  fastify.post('/api/merchant/payments/onboarding', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['storeId'],
        properties: {
          storeId: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    if (!stripe) {
      return reply.code(500).send({ error: 'Stripe no está configurado en el servidor.' });
    }

    const { storeId } = request.body;
    const userId = request.user.sub || request.user.id;
    
    const client = await fastify.pg.connect();
    
    try {
      // Verificar si la tienda pertenece al usuario
      const { rows } = await client.query(
        'SELECT id, name, stripe_account_id FROM public.stores WHERE id = $1 AND owner_id = $2',
        [storeId, userId]
      );

      if (rows.length === 0) {
        return reply.code(403).send({ error: 'No tienes permisos sobre esta sucursal.' });
      }

      let stripeAccountId = rows[0].stripe_account_id;

      // Si no tiene cuenta, crearla
      if (!stripeAccountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          capabilities: {
            transfers: { requested: true },
          },
          business_type: 'company',
          company: {
            name: rows[0].name
          }
        });

        stripeAccountId = account.id;

        // Guardar el ID de la subcuenta en la BD
        await client.query(
          'UPDATE public.stores SET stripe_account_id = $1 WHERE id = $2',
          [stripeAccountId, storeId]
        );
      }

      // Crear el Account Link para el onboarding
      // Nota: En producción, usar dominios reales en lugar de localhost
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${request.headers.origin}/merchant/payments?storeId=${storeId}&refresh=true`,
        return_url: `${request.headers.origin}/merchant/payments?storeId=${storeId}&success=true`,
        type: 'account_onboarding',
      });

      return reply.code(200).send({
        status: 'success',
        url: accountLink.url
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Error al generar link de onboarding', details: error.message });
    } finally {
      client.release();
    }
  });

  // 2. Endpoint para obtener saldo e historial de liquidaciones
  fastify.get('/api/merchant/payments/balance/:storeId', {
    onRequest: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['storeId'],
        properties: {
          storeId: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    if (!stripe) {
      return reply.code(500).send({ error: 'Stripe no está configurado en el servidor.' });
    }

    const { storeId } = request.params;
    const userId = request.user.sub || request.user.id;
    
    const client = await fastify.pg.connect();
    
    try {
      // Verificar si la tienda pertenece al usuario (Owner o Staff)
      const { rows } = await client.query(
        'SELECT id, stripe_account_id FROM public.stores WHERE id = $1',
        [storeId]
      );

      if (rows.length === 0) {
        return reply.code(404).send({ error: 'Sucursal no encontrada.' });
      }

      const stripeAccountId = rows[0].stripe_account_id;

      if (!stripeAccountId) {
        return reply.code(200).send({
          status: 'success',
          isLinked: false
        });
      }

      // Verificar estado de la cuenta en Stripe
      const account = await stripe.accounts.retrieve(stripeAccountId);
      const chargesEnabled = account.charges_enabled;

      // Si está vinculada pero no ha completado el onboarding
      if (!chargesEnabled) {
        return reply.code(200).send({
          status: 'success',
          isLinked: true,
          isActive: false,
          message: 'Falta completar detalles en Stripe.'
        });
      }

      // Obtener saldo
      const balance = await stripe.balance.retrieve({
        stripeAccount: stripeAccountId
      });

      // Obtener últimas liquidaciones (payouts)
      const payoutsList = await stripe.payouts.list({
        limit: 10
      }, {
        stripeAccount: stripeAccountId
      });

      return reply.code(200).send({
        status: 'success',
        isLinked: true,
        isActive: true,
        balance: {
          available: balance.available,
          pending: balance.pending
        },
        payouts: payoutsList.data
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Error al recuperar saldos', details: error.message });
    } finally {
      client.release();
    }
  });
}
