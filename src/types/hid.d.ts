interface HIDDevice {
  opened: boolean;
  vendorId: number;
  productId: number;
  productName: string;
  collections: HIDCollectionInfo[];
}

interface HIDCollectionInfo {
  usagePage: number;
  usage: number;
  type: number;
}

interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

interface Navigator {
  hid: {
    requestDevice(options: {
      filters: HIDDeviceFilter[];
    }): Promise<HIDDevice[]>;
    getDevices(): Promise<HIDDevice[]>;
  };
} 