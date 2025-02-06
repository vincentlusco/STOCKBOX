import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class WebSocketService extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map();
    this.subscriptions = new Map();
  }

  async subscribe(symbol, type) {
    const key = `${type}:${symbol}`;
    
    if (!this.connections.has(type)) {
      await this.connect(type);
    }

    if (!this.subscriptions.has(key)) {
      const ws = this.connections.get(type);
      this.subscriptions.set(key, true);
      
      switch (type) {
        case 'STOCK':
          ws.send(JSON.stringify({
            type: 'subscribe',
            symbol: symbol
          }));
          break;
          
        case 'CRYPTO':
          ws.send(JSON.stringify({
            method: 'SUBSCRIBE',
            params: [`${symbol.toLowerCase()}@trade`],
            id: 1
          }));
          break;
      }
    }
  }

  async connect(type) {
    let ws;
    
    switch (type) {
      case 'STOCK':
        ws = new WebSocket('wss://streamer.finance.yahoo.com');
        break;
        
      case 'CRYPTO':
        ws = new WebSocket('wss://stream.binance.com:9443/ws');
        break;
        
      default:
        throw new Error(`Unsupported WebSocket type: ${type}`);
    }

    return new Promise((resolve, reject) => {
      ws.on('open', () => {
        this.connections.set(type, ws);
        this.setupWebSocket(ws, type);
        resolve();
      });

      ws.on('error', reject);
    });
  }

  setupWebSocket(ws, type) {
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      
      switch (type) {
        case 'STOCK':
          this.handleStockMessage(message);
          break;
          
        case 'CRYPTO':
          this.handleCryptoMessage(message);
          break;
      }
    });

    ws.on('close', () => {
      this.connections.delete(type);
      // Attempt to reconnect after delay
      setTimeout(() => this.connect(type), 5000);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${type}:`, error);
    });
  }

  handleStockMessage(message) {
    if (message.type === 'trade') {
      this.emit('price', {
        symbol: message.symbol,
        price: message.price,
        volume: message.size,
        timestamp: message.timestamp
      });
    }
  }

  handleCryptoMessage(message) {
    if (message.e === 'trade') {
      this.emit('price', {
        symbol: message.s,
        price: parseFloat(message.p),
        volume: parseFloat(message.q),
        timestamp: message.T
      });
    }
  }

  unsubscribe(symbol, type) {
    const key = `${type}:${symbol}`;
    if (this.subscriptions.has(key)) {
      const ws = this.connections.get(type);
      
      switch (type) {
        case 'STOCK':
          ws.send(JSON.stringify({
            type: 'unsubscribe',
            symbol: symbol
          }));
          break;
          
        case 'CRYPTO':
          ws.send(JSON.stringify({
            method: 'UNSUBSCRIBE',
            params: [`${symbol.toLowerCase()}@trade`],
            id: 1
          }));
          break;
      }
      
      this.subscriptions.delete(key);
    }
  }
}

export const wsService = new WebSocketService(); 