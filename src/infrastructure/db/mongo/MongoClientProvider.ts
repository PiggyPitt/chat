import dns from 'dns';
import mongoose from 'mongoose';
import { config } from '../../../shared/config/index.js';

// Windows DNS Client (127.0.0.1) cannot resolve MongoDB Atlas SRV records via IPv6.
// Bypass it by providing a custom lookup that uses Google DNS directly.
dns.setServers(['8.8.8.8', '8.8.4.4']);
function lookup(hostname: string, _options: unknown, callback: (err: NodeJS.ErrnoException | null, addresses: dns.LookupAddress[]) => void): void {
  dns.resolve4(hostname, (err, addresses) => {
    if (err || !addresses?.length) {
      dns.lookup(hostname, { all: true, family: 4 }, callback);
      return;
    }
    callback(null, [{ address: addresses[0]!, family: 4 }]);
  });
}

export class MongoClientProvider {
  static async connect(): Promise<typeof mongoose> {
    if (mongoose.connection.readyState === 1) {
      return mongoose;
    }

    await mongoose.connect(config.mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      lookup,
    });

    return mongoose;
  }
}
