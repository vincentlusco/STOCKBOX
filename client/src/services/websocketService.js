import { EventEmitter } from 'events';
import { apiKeys } from '../config/apiKeys';

class WebSocketService extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map();
    this.subscribers = new Map();
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    if (!process.env.REACT_APP_FINNHUB_KEY) {
      console.warn('WebSocket: No API key found');
      return;
    }

    try {
      this.ws = new WebSocket(`wss://ws.finnhub.io?token=${process.env.REACT_APP_FINNHUB_KEY}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket Connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket Closed');
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, 1000 * Math.pow(2, this.reconnectAttempts));
        }
      };
    } catch (error) {
      console.error('WebSocket Connection Error:', error);
    }
  }

  subscribe(channel, callback) {
    // Format: FOREX:EUR/USD
    const [type, symbol] = channel.split(':');
    
    if (type === 'FOREX') {
      if (!this.connections.has(symbol)) {
        // Connect to Exchange Rate API WebSocket
        const ws = new WebSocket(`wss://ws.exchangerate-api.com/v1/${apiKeys.EXCHANGE_RATE_API}`);
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const subscribers = this.subscribers.get(symbol) || [];
          subscribers.forEach(cb => cb(data));
        };

        this.connections.set(symbol, ws);
      }

      // Add subscriber
      const subscribers = this.subscribers.get(symbol) || [];
      this.subscribers.set(symbol, [...subscribers, callback]);
    }
  }

  unsubscribe(channel, callback) {
    const [_, symbol] = channel.split(':');
    const subscribers = this.subscribers.get(symbol) || [];
    this.subscribers.set(symbol, subscribers.filter(cb => cb !== callback));

    // Clean up if no subscribers left
    if (this.subscribers.get(symbol).length === 0) {
      const ws = this.connections.get(symbol);
      if (ws) {
        ws.close();
        this.connections.delete(symbol);
      }
      this.subscribers.delete(symbol);
    }
  }
}

export const websocketService = new WebSocketService(); 