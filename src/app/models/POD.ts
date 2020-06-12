export class CommonClass
{
    IsActive: boolean;
    CreatedOn: Date | string;
    CreatedBy: string;
    ModifiedOn: Date | string | null;
    ModifiedBy: string;
}

export class BPCPODHeader extends CommonClass
{
    ID: number;
    Client: string;
    Company: string;
    Type: string;
    PatnerID: string;
    DocNumber: string;
    InvoiceNumber: string;
    InvoiceDate: Date | string | null;
    TruckNumber: string;
    VessleNumber: string;
    Amount: number | null;
    Currency: string;
    Transporter: string;
    Status: string;
}

export class BPCPODItem extends CommonClass
{
    ID: number;
    Client: string;
    Company: string;
    Type: string;
    PatnerID: string;
    DocNumber: string;
    InvoiceNumber: string;
    Item: string;
    Material: string;
    MaterialText: string;
    Qty: number;
    ReceivedQty: number | null;
    BreakageQty: number | null;
    MissingQty: number | null;
    AcceptedQty: number | null;
    Reason: string;
    Remarks: string;
}
export class BPCPODView extends CommonClass
{
    ID: number;
    Client: string;
    Company: string;
    Type: string;
    PatnerID: string;
    DocNumber: string;
    InvoiceNumber: string;
    InvoiceDate: Date | string | null;
    TruckNumber: string;
    VessleNumber: string;
    Amount: number | null;
    Currency: string;
    Transporter: string;
    Status: string;
    PODItems: BPCPODItem[];
}
export class BPCReasonMaster extends CommonClass {
    ID: number;
    ReasonCode: string;
    ReasonText: string;
}