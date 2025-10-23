const EventEmitter = require('events');

const statusEmitter = new EventEmitter();
statusEmitter.setMaxListeners(200);

const timers = new Map();

const STAGE_TIMINGS = {
  PROCESSING: { minDelay: 20000, maxDelay: 20000 },
  SHIPPED: { minDelay: 20000, maxDelay: 20000 },
  DELIVERED: { minDelay: 20000, maxDelay: 20000 }
};

const CARRIERS = ['UPS', 'FedEx', 'DHL', 'USPS'];

function pickCarrier(orderDoc) {
  if (!orderDoc) return null;
  if (orderDoc.carrier) return orderDoc.carrier;
  const index = Math.abs(orderDoc._id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % CARRIERS.length;
  return CARRIERS[index];
}

function computeEstimatedDelivery(status, currentEstimatedDelivery) {
  const now = new Date();
  switch (status) {
    case 'PROCESSING':
      return currentEstimatedDelivery || new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    case 'SHIPPED':
      return currentEstimatedDelivery || new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    case 'DELIVERED':
      return now;
    default:
      return currentEstimatedDelivery || null;
  }
}

function randomDelay(min, max) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : safeMin;
  const effectiveMin = Math.max(0, Math.min(safeMin, safeMax));
  const effectiveMax = Math.max(effectiveMin, Math.max(safeMin, safeMax));
  if (effectiveMax === effectiveMin) {
    return effectiveMin;
  }
  const span = effectiveMax - effectiveMin;
  return effectiveMin + Math.floor(Math.random() * (span + 1));
}

function stopOrderSimulation(orderId) {
  const key = String(orderId);
  const existing = timers.get(key);
  if (existing?.timeoutId) {
    clearTimeout(existing.timeoutId);
  }
  timers.delete(key);
}

function scheduleNextStage(orderService, previousOrder, currentIndex) {
  const sequence = orderService.ORDER_STATUS_SEQUENCE || [];
  const orderId = String(previousOrder._id);
  const nextIndex = currentIndex + 1;

  if (nextIndex >= sequence.length) {
    stopOrderSimulation(orderId);
    return;
  }

  const nextStatus = sequence[nextIndex];
  const timing = STAGE_TIMINGS[nextStatus] || { minDelay: 0, maxDelay: 0 };
  const delay = randomDelay(timing.minDelay, timing.maxDelay);

  const timeoutId = setTimeout(async () => {
    try {
      const expectedCurrentStatus = sequence[currentIndex];
      const carrier = nextStatus === 'PROCESSING'
        ? pickCarrier(previousOrder)
        : previousOrder.carrier;
      const estimatedDelivery = computeEstimatedDelivery(nextStatus, previousOrder.estimatedDelivery);

      let updatedOrder = await orderService.transitionOrderStatus(
        previousOrder._id,
        expectedCurrentStatus,
        nextStatus,
        {
          carrier,
          estimatedDelivery
        }
      );

      if (!updatedOrder) {
        updatedOrder = await orderService.getOrderById(previousOrder._id);
      }

      if (!updatedOrder) {
        stopOrderSimulation(orderId);
        return;
      }

      statusEmitter.emit('order-update', updatedOrder);

      if (updatedOrder.status === 'DELIVERED') {
        stopOrderSimulation(orderId);
        return;
      }

      const resolvedIndex = sequence.indexOf(updatedOrder.status);
      if (resolvedIndex === -1) {
        stopOrderSimulation(orderId);
        return;
      }

      scheduleNextStage(orderService, updatedOrder, resolvedIndex);
    } catch (error) {
      stopOrderSimulation(orderId);
    }
  }, delay);

  const existing = timers.get(orderId);
  if (existing?.timeoutId) {
    clearTimeout(existing.timeoutId);
  }

  timers.set(orderId, { timeoutId });
}

function startOrderSimulation(orderService, orderDoc) {
  if (!orderService?.ORDER_STATUS_SEQUENCE || !orderDoc?._id) {
    return;
  }

  const orderId = String(orderDoc._id);
  if (timers.has(orderId)) {
    return;
  }

  if (orderDoc.status === 'DELIVERED') {
    statusEmitter.emit('order-update', orderDoc);
    return;
  }

  const sequence = orderService.ORDER_STATUS_SEQUENCE;
  let currentIndex = sequence.indexOf(orderDoc.status);
  if (currentIndex === -1) {
    currentIndex = 0;
  }

  scheduleNextStage(orderService, orderDoc, currentIndex);
}

module.exports = {
  startOrderSimulation,
  stopOrderSimulation,
  statusEmitter,
  STAGE_TIMINGS
};
