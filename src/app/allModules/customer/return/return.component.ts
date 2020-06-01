import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthenticationDetails, UserWithRole } from 'app/models/master';
import { Guid } from 'guid-typescript';
import { NotificationSnackBarComponent } from 'app/notifications/notification-snack-bar/notification-snack-bar.component';

import { FormGroup, FormArray, AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { BPCOFHeader, BPCOFItem } from 'app/models/OrderFulFilment';
import { BehaviorSubject } from 'rxjs';
import { MatPaginator, MatSort, MatTableDataSource, MatSnackBar, MatDialog, MatDialogConfig } from '@angular/material';
import { BPCInvoiceAttachment, DocumentCenter, BPCCountryMaster, BPCCurrencyMaster, BPCDocumentCenterMaster } from 'app/models/ASN';
import { SelectionModel } from '@angular/cdk/collections';
import { FuseConfigService } from '@fuse/services/config.service';
import { MasterService } from 'app/services/master.service';
import { FactService } from 'app/services/fact.service';
import { POService } from 'app/services/po.service';
import { CustomerService } from 'app/services/customer.service';
import { ASNService } from 'app/services/asn.service';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackBarStatus } from 'app/notifications/notification-snack-bar/notification-snackbar-status-enum';
import { NotificationDialogComponent } from 'app/notifications/notification-dialog/notification-dialog.component';
import { AttachmentDetails } from 'app/models/task';
import { AttachmentDialogComponent } from 'app/allModules/pages/attachment-dialog/attachment-dialog.component';
import { BPCRetHeader, BPCRetView, BPCRetItem, BPCProd } from 'app/models/customer';

@Component({
  selector: 'app-return',
  templateUrl: './return.component.html',
  styleUrls: ['./return.component.scss']
})
export class ReturnComponent implements OnInit {

  authenticationDetails: AuthenticationDetails;
  currentUserID: Guid;
  currentUserName: string;
  currentUserRole: string;
  MenuItems: string[];
  notificationSnackBarComponent: NotificationSnackBarComponent;
  IsProgressBarVisibile: boolean;
  AllReturnHeaders: BPCRetHeader[] = [];
  ReturnFormGroup: FormGroup;
  ReturnItemFormGroup: FormGroup;
  InvoiceDetailsFormGroup: FormGroup;
  DocumentCenterFormGroup: FormGroup;
  AllUserWithRoles: UserWithRole[] = [];
  SelectedRetReqID: string;
  PO: BPCOFHeader;
  POItems: BPCOFItem[] = [];
  SelectedReturnHeader: BPCRetHeader;
  SelectedReturnNumber: string;
  SelectedReturnView: BPCRetView;
  AllReturnItems: BPCRetItem[] = [];
  ReturnItemDisplayedColumns: string[] = [
    'Item',
    'ProdcutID',
    // 'MaterialText',
    'OrderQty',
    'RetQty',
    // 'DeliveryDate',
    'ReasonText',
    'Action'
  ];
  ReturnItemDataSource: MatTableDataSource<BPCRetItem>;
  @ViewChild(MatPaginator) ReturnItemPaginator: MatPaginator;
  @ViewChild(MatSort) ReturnItemSort: MatSort;
  invoiceAttachment: File;
  invAttach: BPCInvoiceAttachment;
  fileToUpload: File;
  fileToUploadList: File[] = [];
  math = Math;
  minDate: Date;
  maxDate: Date;

  selection = new SelectionModel<any>(true, []);
  searchText = '';

  AllCountries: BPCCountryMaster[] = [];
  AllCurrencies: BPCCurrencyMaster[] = [];
  AllProducts: BPCProd[] = [];
  isQtyError: boolean;
  @ViewChild('fileInput1') fileInput: ElementRef<HTMLElement>;
  selectedDocCenterMaster: BPCDocumentCenterMaster;
  ArrivalDateInterval: number;

  constructor(
    private _fuseConfigService: FuseConfigService,
    private _masterService: MasterService,
    private _FactService: FactService,
    private _POService: POService,
    private _CustomerService: CustomerService,
    private _ASNService: ASNService,
    private _datePipe: DatePipe,
    private _route: ActivatedRoute,
    private _router: Router,
    public snackBar: MatSnackBar,
    private dialog: MatDialog,
    private _formBuilder: FormBuilder) {
    this.notificationSnackBarComponent = new NotificationSnackBarComponent(this.snackBar);
    this.authenticationDetails = new AuthenticationDetails();
    this.notificationSnackBarComponent = new NotificationSnackBarComponent(this.snackBar);
    this.IsProgressBarVisibile = false;
    this.PO = new BPCOFHeader();
    this.SelectedReturnHeader = new BPCRetHeader();
    this.SelectedReturnHeader.Status = 'Open';
    this.SelectedReturnView = new BPCRetView();
    this.SelectedReturnNumber = '';
    this.invAttach = new BPCInvoiceAttachment();
    this.minDate = new Date();
    this.minDate.setDate(this.minDate.getDate() + 1);
    this.maxDate = new Date();
    this.isQtyError = false;
    this.selectedDocCenterMaster = new BPCDocumentCenterMaster();
    this.ArrivalDateInterval = 1;
  }

  ngOnInit(): void {
    // Retrive authorizationData
    const retrievedObject = localStorage.getItem('authorizationData');
    if (retrievedObject) {
      this.authenticationDetails = JSON.parse(retrievedObject) as AuthenticationDetails;
      this.currentUserID = this.authenticationDetails.UserID;
      this.currentUserName = this.authenticationDetails.UserName;
      this.currentUserRole = this.authenticationDetails.UserRole;
      this.MenuItems = this.authenticationDetails.MenuItemNames.split(',');
      if (this.MenuItems.indexOf('Return') < 0) {
        this.notificationSnackBarComponent.openSnackBar('You do not have permission to visit this page', SnackBarStatus.danger
        );
        this._router.navigate(['/auth/login']);
      }
    } else {
      this._router.navigate(['/auth/login']);
    }
    this._route.queryParams.subscribe(params => {
      this.SelectedRetReqID = params['id'];
    });
    this.InitializeReturnFormGroup();
    this.InitializeReturnItemFormGroup();
    this.GetAllBPCCountryMasters();
    this.GetAllBPCCurrencyMasters();
    this.GetAllProducts();
    this.GetReturnBasedOnCondition();
  }

  InitializeReturnFormGroup(): void {
    this.ReturnFormGroup = this._formBuilder.group({
      RetReqID: [''],
      Date: [new Date(), Validators.required],
      InvoiceDoc: ['', Validators.required],
      Text: ['', Validators.required],
      Status: [''],
    });
  }
  // SetInitialValueForReturnFormGroup(): void {
  //     this.ReturnFormGroup.get('Date').patchValue('Road');
  //     this.ReturnFormGroup.get('AWBDate').patchValue(new Date());
  //     this.ReturnFormGroup.get('NetAmountReasonText').patchValue('KG');
  //     this.ReturnFormGroup.get('GrossAmountReasonText').patchValue('KG');
  //     this.ReturnFormGroup.get('DepartureDate').patchValue(new Date());
  //     this.ReturnFormGroup.get('ArrivalDate').patchValue(this.minDate);
  //     this.ReturnFormGroup.get('CountryOfOrigin').patchValue('IND');
  // }
  InitializeReturnItemFormGroup(): void {
    this.ReturnItemFormGroup = this._formBuilder.group({
      Item: ['', Validators.required],
      ProdcutID: ['', Validators.required],
      MaterialText: [''],
      RetQty: ['', [Validators.required, Validators.pattern('^([1-9][0-9]*)([.][0-9]{1,2})?$')]],
      OrderQty: ['', [Validators.required, Validators.pattern('^([1-9][0-9]*)([.][0-9]{1,2})?$')]],
      // DeliveryDate: ['', Validators.required],
      ReasonText: [''],
    });
  }

  ResetControl(): void {
    this.SelectedReturnHeader = new BPCRetHeader();
    this.SelectedReturnHeader.Status = 'Open';
    this.SelectedReturnView = new BPCRetView();
    this.SelectedReturnNumber = '';
    this.ResetReturnFormGroup();
    // this.SetInitialValueForReturnFormGroup();
    this.ResetReturnItemFormGroup();
    this.ResetAttachments();
    this.AllReturnItems = [];
    this.ReturnItemDataSource = new MatTableDataSource(this.AllReturnItems);
    this.isQtyError = false;
    this.selectedDocCenterMaster = new BPCDocumentCenterMaster();
  }

  ResetReturnFormGroup(): void {
    this.ResetFormGroup(this.ReturnFormGroup);
  }
  ResetReturnItemFormGroup(): void {
    this.ResetFormGroup(this.ReturnItemFormGroup);
  }

  ResetFormGroup(formGroup: FormGroup): void {
    formGroup.reset();
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key).enable();
      formGroup.get(key).markAsUntouched();
    });
  }
  ClearFormArray = (formArray: FormArray) => {
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }

  ResetAttachments(): void {
    this.fileToUpload = null;
    this.fileToUploadList = [];
    this.invoiceAttachment = null;
  }

  GetReturnBasedOnCondition(): void {
    if (this.SelectedRetReqID) {
      this.GetReturnByRetAndPartnerID();
    }
  }

  DateSelected(event): void {
    const selectedType = event.value;
    if (event.value) {
      // this.SelectedTask.Type = event.value;
    }
  }

  decimalOnly(event): boolean {
    // this.AmountSelected();
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode === 8 || charCode === 9 || charCode === 13 || charCode === 46
      || charCode === 37 || charCode === 39 || charCode === 123 || charCode === 190) {
      return true;
    }
    else if (charCode < 48 || charCode > 57) {
      return false;
    }
    return true;
  }
  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode === 8 || charCode === 9 || charCode === 13 || charCode === 46
      || charCode === 37 || charCode === 39 || charCode === 123) {
      return true;
    }
    else if (charCode < 48 || charCode > 57) {
      return false;
    }
    return true;
  }

  handleFileInput1(evt): void {
    if (evt.target.files && evt.target.files.length > 0) {
      if (this.invoiceAttachment && this.invoiceAttachment.name) {
        this.notificationSnackBarComponent.openSnackBar('Maximum one attachment is allowed, old is attachment is replaced', SnackBarStatus.warning);
      }
      if (this.invAttach && this.invAttach.AttachmentName) {
        this.notificationSnackBarComponent.openSnackBar('Maximum one attachment is allowed, old is attachment is replaced', SnackBarStatus.warning);
      }
      this.invoiceAttachment = evt.target.files[0];
      this.invAttach = new BPCInvoiceAttachment();
    }
  }
  handleFileInput(evt): void {
    if (evt.target.files && evt.target.files.length > 0) {
      const fil = evt.target.files[0] as File;
      if (fil.type.includes(this.selectedDocCenterMaster.Extension)) {
        const fileSize = this.math.round(fil.size / 1024);
        if (fileSize <= this.selectedDocCenterMaster.SizeInKB) {
          this.fileToUpload = fil;
          // this.fileToUploadList.push(this.fileToUpload);
          this.DocumentCenterFormGroup.get('Filename').patchValue(this.fileToUpload.name);
        } else {
          this.notificationSnackBarComponent.openSnackBar(`Maximum allowed file size is ${this.selectedDocCenterMaster.SizeInKB} KB only`, SnackBarStatus.danger);
        }
      } else {
        this.notificationSnackBarComponent.openSnackBar(`Please select only ${this.selectedDocCenterMaster.Extension} file`, SnackBarStatus.danger);
      }
    }
  }

  ProductSelected(event): void {
    if (event.value) {
      const selectedProd = this.AllProducts.filter(x => x.ProductID === event.value)[0];
      if (selectedProd) {
        this.ReturnItemFormGroup.get('MaterialText').patchValue(selectedProd.Text);
      }
    }
  }

  AddDocumentCenterFileValidator(): void {
    this.DocumentCenterFormGroup.get('Filename').setValidators(Validators.required);
    this.DocumentCenterFormGroup.get('Filename').updateValueAndValidity();
  }
  RemoveDocumentCenterFileValidator(): void {
    this.DocumentCenterFormGroup.get('Filename').clearValidators();
    this.DocumentCenterFormGroup.get('Filename').updateValueAndValidity();
  }

  AddReturnItemToTable(): void {
    if (this.ReturnItemFormGroup.valid) {
      const PIItem = new BPCRetItem();
      PIItem.Item = this.ReturnItemFormGroup.get('Item').value;
      PIItem.ProdcutID = this.ReturnItemFormGroup.get('ProdcutID').value;
      PIItem.MaterialText = this.ReturnItemFormGroup.get('MaterialText').value;
      PIItem.RetQty = this.ReturnItemFormGroup.get('RetQty').value;
      PIItem.OrderQty = this.ReturnItemFormGroup.get('OrderQty').value;
      // PIItem.DeliveryDate = this.ReturnItemFormGroup.get('DeliveryDate').value;
      PIItem.ReasonText = this.ReturnItemFormGroup.get('ReasonText').value;
      if (!this.AllReturnItems || !this.AllReturnItems.length) {
        this.AllReturnItems = [];
      }
      this.AllReturnItems.push(PIItem);
      this.ReturnItemDataSource = new MatTableDataSource(this.AllReturnItems);
      this.ResetReturnItemFormGroup();
      this.selectedDocCenterMaster = new BPCDocumentCenterMaster();
    } else {
      this.ShowValidationErrors(this.DocumentCenterFormGroup);
    }
  }

  RemoveReturnItemFromTable(doc: BPCRetItem): void {
    const index: number = this.AllReturnItems.indexOf(doc);
    if (index > -1) {
      this.AllReturnItems.splice(index, 1);
    }
    this.ReturnItemDataSource = new MatTableDataSource(this.AllReturnItems);
  }

  GetAllBPCCountryMasters(): void {
    this._ASNService.GetAllBPCCountryMasters().subscribe(
      (data) => {
        this.AllCountries = data as BPCCountryMaster[];
      },
      (err) => {
        console.error(err);
      }
    );
  }

  GetAllBPCCurrencyMasters(): void {
    this._ASNService.GetAllBPCCurrencyMasters().subscribe(
      (data) => {
        this.AllCurrencies = data as BPCCurrencyMaster[];
      },
      (err) => {
        console.error(err);
      }
    );
  }

  GetAllProducts(): void {
    this._CustomerService.GetAllProducts().subscribe(
      (data) => {
        this.AllProducts = data as BPCProd[];
      },
      (err) => {
        console.error(err);
      }
    );
  }

  // GetAllReturnByPartnerID(): void {
  //     this._CustomerService.GetAllReturnByPartnerID(this.currentUserName).subscribe(
  //         (data) => {
  //             this.AllReturnHeaders = data as BPCRetHeader[];
  //             if (this.AllReturnHeaders && this.AllReturnHeaders.length) {
  //                 this.LoadSelectedReturn(this.AllReturnHeaders[0]);
  //             }
  //         },
  //         (err) => {
  //             console.error(err);
  //         }
  //     );
  // }

  GetReturnByRetAndPartnerID(): void {
    this._CustomerService.GetReturnByRetAndPartnerID(this.SelectedRetReqID, this.currentUserName).subscribe(
      (data) => {
        this.SelectedReturnHeader = data as BPCRetHeader;
        if (this.SelectedReturnHeader) {
          this.LoadSelectedReturn(this.SelectedReturnHeader);
        }
      },
      (err) => {
        console.error(err);
      }
    );
  }

  LoadSelectedReturn(seletedReturn: BPCRetHeader): void {
    this.SelectedReturnHeader = seletedReturn;
    this.SelectedReturnView.RetReqID = this.SelectedReturnHeader.RetReqID;
    this.SelectedReturnNumber = this.SelectedReturnHeader.RetReqID;
    this.SetReturnHeaderValues();
    this.GetReturnItemsByRet();
  }

  GetReturnItemsByRet(): void {
    this._CustomerService.GetReturnItemsByRet(this.SelectedReturnHeader.RetReqID).subscribe(
      (data) => {
        const dt = data as BPCRetItem[];
        if (dt && dt.length && dt.length > 0) {
          this.AllReturnItems = data as BPCRetItem[];
          this.ReturnItemDataSource = new MatTableDataSource(this.AllReturnItems);
        }
      },
      (err) => {
        console.error(err);
      }
    );
  }

  SetReturnHeaderValues(): void {
    this.ReturnFormGroup.get('RetReqID').patchValue(this.SelectedReturnHeader.RetReqID);
    this.ReturnFormGroup.get('Date').patchValue(this.SelectedReturnHeader.Date);
    this.ReturnFormGroup.get('InvoiceDoc').patchValue(this.SelectedReturnHeader.InvoiceDoc);
    this.ReturnFormGroup.get('RetReqID').patchValue(this.SelectedReturnHeader.RetReqID);
    this.ReturnFormGroup.get('Text').patchValue(this.SelectedReturnHeader.Text);
    this.ReturnFormGroup.get('Status').patchValue(this.SelectedReturnHeader.Status);
  }

  GetReturnValues(): void {
    const depDate = this.ReturnFormGroup.get('Date').value;
    if (depDate) {
      this.SelectedReturnHeader.Date = this.SelectedReturnView.Date = this._datePipe.transform(depDate, 'yyyy-MM-dd HH:mm:ss');
    } else {
      this.SelectedReturnHeader.Date = this.SelectedReturnView.Date = this.ReturnFormGroup.get('Date').value;
    }
    this.SelectedReturnHeader.InvoiceDoc = this.SelectedReturnView.InvoiceDoc = this.ReturnFormGroup.get('InvoiceDoc').value;
    this.SelectedReturnHeader.Text = this.SelectedReturnView.Text = this.ReturnFormGroup.get('Text').value;
    if (this.SelectedRetReqID) {
      // this.SelectedReturnHeader.Client = this.SelectedReturnView.Client = this.PO.Client;
      // this.SelectedReturnHeader.Company = this.SelectedReturnView.Company = this.PO.Company;
      // this.SelectedReturnHeader.Type = this.SelectedReturnView.Type = this.PO.Type;
      // this.SelectedReturnHeader.PatnerID = this.SelectedReturnView.PatnerID = this.PO.PatnerID;
      this.SelectedReturnHeader.Type = this.SelectedReturnView.Type = 'Customer';
      this.SelectedReturnHeader.PatnerID = this.SelectedReturnView.PatnerID = this.currentUserName;
      this.SelectedReturnHeader.Status = this.SelectedReturnView.Status = this.SelectedReturnHeader.Status;
    }
    else {
      // this.SelectedReturnHeader.Client = this.SelectedReturnView.Client = this.SelectedReturnHeader.Client;
      // this.SelectedReturnHeader.Company = this.SelectedReturnView.Company = this.SelectedReturnHeader.Company;
      this.SelectedReturnHeader.Type = this.SelectedReturnView.Type = 'Customer';
      this.SelectedReturnHeader.PatnerID = this.SelectedReturnView.PatnerID = this.currentUserName;
      this.SelectedReturnHeader.Status = this.SelectedReturnView.Status = 'Open';
    }
  }

  calculateDiff(sentDate): number {
    const dateSent: Date = new Date(sentDate);
    const currentDate: Date = new Date();
    return Math.floor((Date.UTC(dateSent.getFullYear(), dateSent.getMonth(), dateSent.getDate()) -
      Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())) / (1000 * 60 * 60 * 24));
  }

  GetReturnItemValues(): void {
    this.SelectedReturnView.Items = [];
    this.AllReturnItems.forEach(x => {
      x.Type = 'Customer';
      x.PatnerID = this.currentUserName;
      this.SelectedReturnView.Items.push(x);
    });
  }

  SaveClicked(): void {
    if (this.ReturnFormGroup.valid) {
      if (!this.isQtyError) {
        // if (this.ReturnItemFormGroup.valid) {
        //     if (this.InvoiceDetailsFormGroup.valid) {
        this.GetReturnValues();
        this.GetReturnItemValues();
        // this.GetInvoiceDetailValues();
        // this.GetDocumentCenterValues();
        // this.SelectedReturnView.IsSubmitted = false;
        this.SetActionToOpenConfirmation('Save');
        //     } else {
        //         this.ShowValidationErrors(this.InvoiceDetailsFormGroup);
        //     }

        // } else {
        //     this.ShowValidationErrors(this.ReturnItemFormGroup);
        // }
      }

    } else {
      this.ShowValidationErrors(this.ReturnFormGroup);
    }
  }
  SubmitClicked(): void {
    if (this.ReturnFormGroup.valid) {
      if (!this.isQtyError) {
        // if (this.ReturnItemFormGroup.valid) {
        //     if (this.InvoiceDetailsFormGroup.valid) {
        this.GetReturnValues();
        this.GetReturnItemValues();
        // this.GetInvoiceDetailValues();
        // this.GetDocumentCenterValues();
        // this.SelectedReturnView.IsSubmitted = true;
        this.SetActionToOpenConfirmation('Submit');
        //     } else {
        //         this.ShowValidationErrors(this.InvoiceDetailsFormGroup);
        //     }

        // } else {
        //     this.ShowValidationErrors(this.ReturnItemFormGroup);
        // }
      }

    } else {
      this.ShowValidationErrors(this.ReturnFormGroup);
    }
  }
  DeleteClicked(): void {
    if (this.SelectedReturnHeader.RetReqID) {
      const Actiontype = 'Delete';
      const Catagory = 'Return';
      this.OpenConfirmationDialog(Actiontype, Catagory);
    }
  }
  SetActionToOpenConfirmation(Actiontype: string): void {
    // if (this.SelectedReturnHeader.ReturnNumber) {
    //     const Catagory = 'Return';
    //     this.OpenConfirmationDialog(Actiontype, Catagory);
    // } else {
    //     const Catagory = 'Return';
    //     this.OpenConfirmationDialog(Actiontype, Catagory);
    // }
    const Catagory = 'Return';
    this.OpenConfirmationDialog(Actiontype, Catagory);
  }

  OpenConfirmationDialog(Actiontype: string, Catagory: string): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        Actiontype: Actiontype,
        Catagory: Catagory
      },
      panelClass: 'confirmation-dialog'
    };
    const dialogRef = this.dialog.open(NotificationDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      result => {
        if (result) {
          if (Actiontype === 'Save' || Actiontype === 'Submit') {
            if (this.SelectedReturnHeader.RetReqID) {
              this.UpdateReturn(Actiontype);
            } else {
              this.CreateReturn(Actiontype);
            }
          } else if (Actiontype === 'Delete') {
            this.DeleteReturn();
          }
        }
      });
  }


  CreateReturn(Actiontype: string): void {
    // this.GetReturnValues();
    // this.GetBPReturnSubItemValues();
    // this.SelectedReturnView.CreatedBy = this.authenticationDetails.UserID.toString();
    this.IsProgressBarVisibile = true;
    this._CustomerService.CreateReturn(this.SelectedReturnView).subscribe(
      (data) => {
        this.SelectedReturnHeader.RetReqID = (data as BPCRetHeader).RetReqID;
        this.ResetControl();
        this.notificationSnackBarComponent.openSnackBar(`Return ${Actiontype === 'Submit' ? 'submitted' : 'saved'} successfully`, SnackBarStatus.success);
        this.IsProgressBarVisibile = false;

        // if (this.invoiceAttachment) {
        //     this.AddInvoiceAttachment(Actiontype);
        // } else {
        //     if (this.fileToUploadList && this.fileToUploadList.length) {
        //         this.AddDocumentCenterAttachment(Actiontype);
        //     } else {
        //         this.ResetControl();
        //         this.notificationSnackBarComponent.openSnackBar(`Return ${Actiontype === 'Submit' ? 'submitted' : 'saved'} successfully`, SnackBarStatus.success);
        //         this.IsProgressBarVisibile = false;
        //         // this.GetReturnBasedOnCondition();
        //     }
        // }
      },
      (err) => {
        this.showErrorNotificationSnackBar(err);
      }
    );
  }

  // AddInvoiceAttachment(Actiontype: string): void {
  //     this._CustomerService.AddInvoiceAttachment(this.SelectedReturnHeader.RetReqID, this.currentUserID.toString(), this.invoiceAttachment).subscribe(
  //         (dat) => {
  //             if (this.fileToUploadList && this.fileToUploadList.length) {
  //                 this.AddDocumentCenterAttachment(Actiontype);
  //             } else {
  //                 this.ResetControl();
  //                 this.notificationSnackBarComponent.openSnackBar(`Return ${Actiontype === 'Submit' ? 'submitted' : 'saved'} successfully`, SnackBarStatus.success);
  //                 this.IsProgressBarVisibile = false;
  //                 this.GetReturnBasedOnCondition();
  //             }
  //         },
  //         (err) => {
  //             this.showErrorNotificationSnackBar(err);
  //         });
  // }
  // AddDocumentCenterAttachment(Actiontype: string): void {
  //     this._CustomerService.AddDocumentCenterAttachment(this.SelectedReturnHeader.ReturnNumber, this.currentUserID.toString(), this.fileToUploadList).subscribe(
  //         (dat) => {
  //             this.ResetControl();
  //             this.notificationSnackBarComponent.openSnackBar(`Return ${Actiontype === 'Submit' ? 'submitted' : 'saved'} successfully`, SnackBarStatus.success);
  //             this.IsProgressBarVisibile = false;
  //             this.GetReturnBasedOnCondition();
  //         },
  //         (err) => {
  //             this.showErrorNotificationSnackBar(err);
  //         }
  //     );
  // }

  showErrorNotificationSnackBar(err: any): void {
    console.error(err);
    this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
    this.IsProgressBarVisibile = false;
  }

  UpdateReturn(Actiontype: string): void {
    // this.GetReturnValues();
    // this.GetBPReturnSubItemValues();
    // this.SelectedBPReturnView.TransID = this.SelectedBPReturn.TransID;
    // this.SelectedReturnView.ModifiedBy = this.authenticationDetails.UserID.toString();
    this.IsProgressBarVisibile = true;
    this._CustomerService.UpdateReturn(this.SelectedReturnView).subscribe(
      (data) => {
        this.SelectedReturnHeader.RetReqID = (data as BPCRetHeader).RetReqID;
        this.ResetControl();
        this.notificationSnackBarComponent.openSnackBar(`Return ${Actiontype === 'Submit' ? 'submitted' : 'saved'} successfully`, SnackBarStatus.success);
        this.IsProgressBarVisibile = false;

        // if (this.invoiceAttachment) {
        //     this.AddInvoiceAttachment(Actiontype);
        // } else {
        //     if (this.fileToUploadList && this.fileToUploadList.length) {
        //         this.AddDocumentCenterAttachment(Actiontype);
        //     } else {
        //         this.ResetControl();
        //         this.notificationSnackBarComponent.openSnackBar(`Return ${Actiontype === 'Submit' ? 'submitted' : 'saved'} successfully`, SnackBarStatus.success);
        //         this.IsProgressBarVisibile = false;
        //         this.GetReturnBasedOnCondition();
        //     }
        // }
      },
      (err) => {
        console.error(err);
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
        this.IsProgressBarVisibile = false;
      }
    );
  }

  DeleteReturn(): void {
    this.GetReturnValues();
    // this.SelectedBPReturn.ModifiedBy = this.authenticationDetails.userID.toString();
    this.IsProgressBarVisibile = true;
    this._CustomerService.DeleteReturn(this.SelectedReturnHeader).subscribe(
      (data) => {
        // console.log(data);
        this.ResetControl();
        this.notificationSnackBarComponent.openSnackBar('Return deleted successfully', SnackBarStatus.success);
        this.IsProgressBarVisibile = false;
        // this.GetReturnBasedOnCondition();
      },
      (err) => {
        console.error(err);
        this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
        this.IsProgressBarVisibile = false;
      }
    );
  }

  ShowValidationErrors(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      if (!formGroup.get(key).valid) {
        console.log(key);
      }
      formGroup.get(key).markAsTouched();
      formGroup.get(key).markAsDirty();
      if (formGroup.get(key) instanceof FormArray) {
        const FormArrayControls = formGroup.get(key) as FormArray;
        Object.keys(FormArrayControls.controls).forEach(key1 => {
          if (FormArrayControls.get(key1) instanceof FormGroup) {
            const FormGroupControls = FormArrayControls.get(key1) as FormGroup;
            Object.keys(FormGroupControls.controls).forEach(key2 => {
              FormGroupControls.get(key2).markAsTouched();
              FormGroupControls.get(key2).markAsDirty();
              if (!FormGroupControls.get(key2).valid) {
                console.log(key2);
              }
            });
          } else {
            FormArrayControls.get(key1).markAsTouched();
            FormArrayControls.get(key1).markAsDirty();
          }
        });
      }
    });

  }

  // GetInvoiceAttachment(fileName: string, file?: File): void {
  //     if (file && file.size) {
  //         const blob = new Blob([file], { type: file.type });
  //         this.OpenAttachmentDialog(fileName, blob);
  //     } else {
  //         this.IsProgressBarVisibile = true;
  //         this._CustomerService.DowloandInvoiceAttachment(fileName, this.SelectedReturnHeader.ReturnNumber).subscribe(
  //             data => {
  //                 if (data) {
  //                     let fileType = 'image/jpg';
  //                     fileType = fileName.toLowerCase().includes('.jpg') ? 'image/jpg' :
  //                         fileName.toLowerCase().includes('.jpeg') ? 'image/jpeg' :
  //                             fileName.toLowerCase().includes('.png') ? 'image/png' :
  //                                 fileName.toLowerCase().includes('.gif') ? 'image/gif' :
  //                                     fileName.toLowerCase().includes('.pdf') ? 'application/pdf' : '';
  //                     const blob = new Blob([data], { type: fileType });
  //                     this.OpenAttachmentDialog(fileName, blob);
  //                 }
  //                 this.IsProgressBarVisibile = false;
  //             },
  //             error => {
  //                 console.error(error);
  //                 this.IsProgressBarVisibile = false;
  //             }
  //         );
  //     }
  // }

  // GetDocumentCenterAttachment(fileName: string): void {
  //     const file = this.fileToUploadList.filter(x => x.name === fileName)[0];
  //     if (file && file.size) {
  //         const blob = new Blob([file], { type: file.type });
  //         this.OpenAttachmentDialog(fileName, blob);
  //     } else {
  //         this.IsProgressBarVisibile = true;
  //         this._CustomerService.DowloandDocumentCenterAttachment(fileName, this.SelectedReturnHeader.ReturnNumber).subscribe(
  //             data => {
  //                 if (data) {
  //                     let fileType = 'image/jpg';
  //                     fileType = fileName.toLowerCase().includes('.jpg') ? 'image/jpg' :
  //                         fileName.toLowerCase().includes('.jpeg') ? 'image/jpeg' :
  //                             fileName.toLowerCase().includes('.png') ? 'image/png' :
  //                                 fileName.toLowerCase().includes('.gif') ? 'image/gif' :
  //                                     fileName.toLowerCase().includes('.pdf') ? 'application/pdf' : '';
  //                     const blob = new Blob([data], { type: fileType });
  //                     this.OpenAttachmentDialog(fileName, blob);
  //                 }
  //                 this.IsProgressBarVisibile = false;
  //             },
  //             error => {
  //                 console.error(error);
  //                 this.IsProgressBarVisibile = false;
  //             }
  //         );
  //     }
  // }

  OpenAttachmentDialog(FileName: string, blob: Blob): void {
    const attachmentDetails: AttachmentDetails = {
      FileName: FileName,
      blob: blob
    };
    const dialogConfig: MatDialogConfig = {
      data: attachmentDetails,
      panelClass: 'attachment-dialog'
    };
    const dialogRef = this.dialog.open(AttachmentDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
      }
    });
  }

  QtySelected(): void {
    const OrderQtyVAL = +this.ReturnItemFormGroup.get('OrderQty').value;
    const RetQtyVAL = + this.ReturnItemFormGroup.get('RetQty').value;
    if (OrderQtyVAL < RetQtyVAL) {
      this.isQtyError = true;
    } else {
      this.isQtyError = false;
    }
  }

  getStatusColor(StatusFor: string): string {
    switch (StatusFor) {
      case 'Shipped':
        return this.SelectedReturnHeader.Status === 'Open' ? 'gray' :
          this.SelectedReturnHeader.Status === 'SO' ? '#efb577' : '#34ad65';
      case 'Invoiced':
        return this.SelectedReturnHeader.Status === 'Open' ? 'gray' :
          this.SelectedReturnHeader.Status === 'SO' ? 'gray' :
            this.SelectedReturnHeader.Status === 'Shipped' ? '#efb577' : '#34ad65';
      case 'Receipt':
        return this.SelectedReturnHeader.Status === 'Open' ? 'gray' :
          this.SelectedReturnHeader.Status === 'SO' ? 'gray' :
            this.SelectedReturnHeader.Status === 'Shipped' ? 'gray' :
              this.SelectedReturnHeader.Status === 'Invoiced' ? '#efb577' : '#34ad65';
      default:
        return '';
    }
  }

  getTimeline(StatusFor: string): string {
    switch (StatusFor) {
      case 'Shipped':
        return this.SelectedReturnHeader.Status === 'Open' ? 'white-timeline' :
          this.SelectedReturnHeader.Status === 'SO' ? 'orange-timeline' : 'green-timeline';
      case 'Invoiced':
        return this.SelectedReturnHeader.Status === 'Open' ? 'white-timeline' :
          this.SelectedReturnHeader.Status === 'SO' ? 'white-timeline' :
            this.SelectedReturnHeader.Status === 'Shipped' ? 'orange-timeline' : 'green-timeline';
      case 'Receipt':
        return this.SelectedReturnHeader.Status === 'Open' ? 'white-timeline' :
          this.SelectedReturnHeader.Status === 'SO' ? 'white-timeline' :
            this.SelectedReturnHeader.Status === 'Shipped' ? 'white-timeline' :
              this.SelectedReturnHeader.Status === 'Invoiced' ? 'orange-timeline' : 'green-timeline';
      default:
        return '';
    }
  }
  getRestTimeline(StatusFor: string): string {
    switch (StatusFor) {
      case 'Shipped':
        return this.SelectedReturnHeader.Status === 'Open' ? 'white-timeline' :
          this.SelectedReturnHeader.Status === 'SO' ? 'white-timeline' : 'green-timeline';
      case 'Invoiced':
        return this.SelectedReturnHeader.Status === 'Open' ? 'white-timeline' :
          this.SelectedReturnHeader.Status === 'SO' ? 'white-timeline' :
            this.SelectedReturnHeader.Status === 'Shipped' ? 'white-timeline' : 'green-timeline';
      case 'Receipt':
        return this.SelectedReturnHeader.Status === 'Open' ? 'white-timeline' :
          this.SelectedReturnHeader.Status === 'SO' ? 'white-timeline' :
            this.SelectedReturnHeader.Status === 'Shipped' ? 'white-timeline' :
              this.SelectedReturnHeader.Status === 'Invoiced' ? 'white-timeline' : 'green-timeline';
      default:
        return '';
    }
  }
  getStatusDate(StatusFor: string): string {
    const tt = this._datePipe.transform(this.maxDate, 'dd/MM/yyyy');
    switch (StatusFor) {
      case 'SO':
        return this.SelectedReturnHeader.Status === 'Open' ? '' : tt;
      case 'Shipped':
        return this.SelectedReturnHeader.Status === 'Open' ? '' :
          this.SelectedReturnHeader.Status === 'SO' ? '' : tt;
      case 'Invoiced':
        return this.SelectedReturnHeader.Status === 'Open' ? '' :
          this.SelectedReturnHeader.Status === 'SO' ? '' :
            this.SelectedReturnHeader.Status === 'Shipped' ? '' : tt;
      case 'Receipt':
        return this.SelectedReturnHeader.Status === 'Open' ? '' :
          this.SelectedReturnHeader.Status === 'SO' ? '' :
            this.SelectedReturnHeader.Status === '' ? '' :
              this.SelectedReturnHeader.Status === '' ? '' : tt;
      default:
        return '';
    }
  }
}
