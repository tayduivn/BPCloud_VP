import { CommonClass } from './common';
export class BPCASNHeader extends CommonClass {
    Client: string;
    Company: string;
    Type: string;
    PatnerID: string;
    ASNNumber: string;
    ASNDate: Date | string | null;
    DocNumber: string;
    TransportMode: string;
    VessleNumber: string;
    CountryOfOrigin: string;
    AWBNumber: string;
    AWBDate: Date | string | null;
    DepartureDate: Date | string | null;
    ArrivalDate: Date | string | null;
    ShippingAgency: string;
    GrossWeight: number | null;
    GrossWeightUOM: string;
    NetWeight: number | null;
    NetWeightUOM: string;
    VolumetricWeight: number | null;
    VolumetricWeightUOM: string;
    NumberOfPacks: number | null;
    InvoiceNumber: string;
    InvoiceDate: Date | string | null;
    POBasicPrice: number | null;
    TaxAmount: number | null;
    InvoiceAmount: number | null;
    InvoiceAmountUOM: string;
    InvDocReferenceNo: string;
    Status: string;
    IsSubmitted: boolean;
    ArrivalDateInterval: number;
    BillOfLading: string;
    TransporterName: string;
    AccessibleValue: number | null;
    ContactPerson: string;
    ContactPersonNo: string;
}

export class BPCASNItem extends CommonClass {
    ID: number;
    Client: string;
    Company: string;
    Type: string;
    PatnerID: string;
    ASNNumber: string;
    Item: string;
    Material: string;
    MaterialText: string;
    DeliveryDate: Date | string | null;
    OrderedQty: number;
    CompletedQty: number;
    TransitQty: number;
    OpenQty: number;
    ASNQty: number;
    UOM: string;
    Batch: string;
    ManufactureDate: Date | string | null;
    ExpiryDate: Date | string | null;
    ManfCountry: string;
    PlantCode: string;
    UnitPrice: number | null;
    Value: number | null;
    TaxAmount: number | null;
    TaxCode: string;
}
export class BPCASNPack extends CommonClass {
    ID: number;
    Client: string;
    Company: string;
    Type: string;
    PatnerID: string;
    ASNNumber: string;
    // Item: string;
    PackageID: string;
    ReferenceNumber: string;
    Dimension: string;
    GrossWeight: number | null;
    GrossWeightUOM: string;
    NetWeight: number | null;
    NetWeightUOM: string;
    VolumetricWeight: number | null;
    VolumetricWeightUOM: string;
}
export class BPCFLIPHeader extends CommonClass {
    ID: number;
    Client: string;
    Company: string;
    Type: string;
    PatnerID: string;
    FLIPID: string;
    InvoiceNumber: string;
    InvoiceDate: Date | string | null;
    POBasicPrice: number | null;
    TaxAmount: number | null;
    InvoiceAmount: number;
}

export class BPCFLIPItem extends CommonClass {
    ID: number;
    Client: string;
    Company: string;
    Type: string;
    PatnerID: string;
    FLIPID: string;
    Item: string;
    Material: string;
    MaterialText: string;
    DeliveryDate: Date | string | null;
    OrderedQty: number;
    OpenQty: number;
    InvoiceQty: number;
    UOM: string;
    HSN: string;
}

export class BPCFLIPCost extends CommonClass {
    ID: number;
    Client: string;
    Company: string;
    Type: string;
    PatnerID: string;
    FLIPID: string;
    ExpenceType: string;
    Amount: number;
    Remarks: string;
}

export class BPCASNView extends CommonClass {
    Client: string;
    Company: string;
    Type: string;
    PatnerID: string;
    ASNNumber: string;
    ASNDate: Date | string | null;
    DocNumber: string;
    TransportMode: string;
    VessleNumber: string;
    CountryOfOrigin: string;
    AWBNumber: string;
    AWBDate: Date | string | null;
    DepartureDate: Date | string | null;
    ArrivalDate: Date | string | null;
    ShippingAgency: string;
    GrossWeight: number | null;
    GrossWeightUOM: string;
    NetWeight: number | null;
    NetWeightUOM: string;
    VolumetricWeight: number | null;
    VolumetricWeightUOM: string;
    NumberOfPacks: number | null;
    InvoiceNumber: string;
    InvoiceDate: Date | string | null;
    POBasicPrice: number | null;
    TaxAmount: number | null;
    InvoiceAmount: number | null;
    InvoiceAmountUOM: string;
    InvDocReferenceNo: string;
    IsSubmitted: boolean;
    ArrivalDateInterval: number;
    BillOfLading: string;
    TransporterName: string;
    AccessibleValue: number | null;
    ContactPerson: string;
    ContactPersonNo: string;
    ASNItems: BPCASNItem[];
    ASNPacks: BPCASNPack[];
    DocumentCenters: DocumentCenter[];
    constructor() {
        super();
        this.ASNItems = [];
        this.ASNPacks = [];
        this.DocumentCenters = [];
    }
}
export class DocumentCenter extends CommonClass {
    ASNNumber: string;
    DocumentType: string;
    DocumentTitle: string;
    Filename: string;
    AttachmentReferenceNo: string;
}

export class BPCInvoiceAttachment {
    AttachmentID: number;
    AttachmentName: string;
    ReferenceNo: string;
    ContentType: string;
    ContentLength: number;
}

export class BPCCountryMaster extends CommonClass {
    ID: number;
    CountryCode: string;
    CountryName: string;
}
export class BPCCurrencyMaster extends CommonClass {
    ID: number;
    CurrencyCode: string;
    CurrencyName: string;
}
export class BPCDocumentCenterMaster extends CommonClass {
    AppID: number;
    DocumentType: string;
    Text: string;
    Mandatory: boolean;
    Extension: string;
    SizeInKB: number;
    ForwardMail: string;
}

export class ASNItemXLSX {
    Item: string;
    Material: string;
    MaterialText: string;
    UnitPrice: number;
    DeliveryDate: Date | string | null;
    OrderedQty: number;
    GRQty: number;
    PipelineQty: number;
    OpenQty: number;
    ASNQty: number;
    Batch: string;
    ManufactureDate: Date | string | null;
    ExpiryDate: Date | string | null;
}

export class ASNListView {
    Client: string;
    Company: string;
    Type: string;
    PatnerID: string;
    ASNNumber: string;
    ASNDate: Date | string | null;
    DocNumber: string;
    VessleNumber: string;
    AWBNumber: string;
    Material: string;
    MaterialText: string;
    ASNQty: number;
    Status: string;
}


