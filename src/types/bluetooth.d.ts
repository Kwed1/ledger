interface BluetoothDevice {
	id: string;
	name?: string;
	gatt?: {
		connect(): Promise<BluetoothRemoteGATTServer>;
	};
}

interface BluetoothRemoteGATTServer {
	connected: boolean;
	device: BluetoothDevice;
	getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
	getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
	readValue(): Promise<DataView>;
	writeValue(value: BufferSource): Promise<void>;
}

declare global {
	interface Navigator {
		bluetooth: {
			getAvailability(): Promise<boolean>;
			requestDevice(options: {
				filters?: Array<{ services?: string[] }>;
				optionalServices?: string[];
			}): Promise<BluetoothDevice>;
		};
	}
} 