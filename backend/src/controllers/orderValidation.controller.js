/**
 * orderValidation.controller.js
 * Controlador de Fastify para la validación de tickets QR en el local.
 */

export const validateOrderDelivery = async (request, reply) => {
  const { token } = request.body;
  // En producción, extraer del JWT: request.user.sub
  const merchantId = request.user?.sub || '22222222-2222-2222-2222-222222222222';

  try {
    // 1. Buscar el pedido por token (hash largo) o código manual (4-6 dígitos)
    const query = `
      SELECT o.id, o.store_id, o.status, o.pickup_start_time, o.pickup_end_time 
      FROM public.orders o
      WHERE (o.validation_token = $1 OR o.manual_code = $1)
      LIMIT 1;
    `;
    const { rows } = await request.server.pg.query(query, [token]);

    if (rows.length === 0) {
      return reply.code(404).send({
        status: 'error',
        message: 'Ticket no encontrado. Verifica el código ingresado.'
      });
    }

    const order = rows[0];

    // 2. Seguridad: Validar que el pedido pertenece a este comercio
    if (order.store_id !== merchantId) {
      return reply.code(403).send({
        status: 'error',
        message: 'Operación denegada. Este ticket pertenece a otro comercio.'
      });
    }

    // 3. Validar Estado del Pedido
    if (order.status === 'DELIVERED') {
      return reply.code(400).send({
        status: 'error',
        message: 'Este ticket ya fue canjeado y entregado previamente.'
      });
    }

    if (order.status !== 'RESERVED') {
      return reply.code(400).send({ 
        status: 'error', 
        message: `El pedido no está activo. Estado actual: ${order.status}` 
      });
    }

    // 4. Validación ESTRICTA de Ventana Horaria de Recogida
    const now = new Date();
    const startTime = new Date(order.pickup_start_time);
    const endTime = new Date(order.pickup_end_time);

    // Ajustamos la lógica de cruce de medianoche en el servidor
    // Si endTime es cronológicamente anterior a startTime, significa que cruza la medianoche.
    let isWithinWindow = false;
    
    if (startTime < endTime) {
      // Escenario normal en el mismo día (Ej: 10:00 a 18:00)
      isWithinWindow = now >= startTime && now <= endTime;
    } else {
      // Escenario cruzando medianoche (Ej: 22:00 a 02:00 del día siguiente)
      isWithinWindow = now >= startTime || now <= endTime;
    }

    if (!isWithinWindow) {
      return reply.code(400).send({ 
        status: 'error', 
        message: 'Fuera de horario. No se puede entregar el pedido fuera de la ventana estricta de recogida.' 
      });
    }

    // 5. Todo válido -> Marcar como Entregado
    const updateQuery = `
      UPDATE public.orders 
      SET status = 'DELIVERED', updated_at = NOW() 
      WHERE id = $1 
      RETURNING id, status;
    `;
    const updateResult = await request.server.pg.query(updateQuery, [order.id]);

    // Opcional: Aquí se dispararía un evento en Postgres para Supabase Realtime 
    // que el teléfono del cliente esté escuchando.

    return reply.send({
      status: 'success',
      message: 'Ticket validado correctamente. Pedido entregado.',
      data: updateResult.rows[0]
    });

  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ 
      status: 'error', 
      message: 'Error interno del servidor al procesar la validación.' 
    });
  }
};

/**
 * Validación del Payload Entrante
 */
export const validateOrderSchema = {
  schema: {
    body: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string', minLength: 4 }
      }
    }
  }
};
