interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
}

interface Bluetooth {
  getAvailability(): Promise<boolean>;
  requestDevice(options: {
    filters: Array<{ services: string[] }>;
    optionalServices?: string[];
  }): Promise<BluetoothDevice>;
}

interface Navigator {
  bluetooth: Bluetooth;
} 