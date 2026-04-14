'use strict';

class ServiceRegistry {
  constructor() {
    this.services = new Map();
  }

  register(name, service) {
    if (!name || !service) return;
    this.services.set(name, service);
  }

  get(name) {
    return this.services.get(name) || null;
  }

  has(name) {
    return this.services.has(name);
  }

  unregister(name) {
    this.services.delete(name);
  }

  list() {
    return [...this.services.keys()];
  }
}

module.exports = new ServiceRegistry();
