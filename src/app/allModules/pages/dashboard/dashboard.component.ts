import { Component, OnInit } from '@angular/core';
import { AuthenticationDetails, AppUsage } from 'app/models/master';
import { Guid } from 'guid-typescript';
import { NotificationSnackBarComponent } from 'app/notifications/notification-snack-bar/notification-snack-bar.component';
import { SelectionModel } from '@angular/cdk/collections';
import { BPCFact } from 'app/models/fact';
import { BPCOFAIACT } from 'app/models/OrderFulFilment';
import { FactService } from 'app/services/fact.service';
import { MasterService } from 'app/services/master.service';
import { DashboardService } from 'app/services/dashboard.service';
import { Router } from '@angular/router';
import { MatSnackBar, MatDialog, MatDialogConfig } from '@angular/material';
import { SnackBarStatus } from 'app/notifications/notification-snack-bar/notification-snackbar-status-enum';
import { NotificationDialogComponent } from 'app/notifications/notification-dialog/notification-dialog.component';
import { TourComponent } from '../tour/tour.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  menuItems: string[];
  authenticationDetails: AuthenticationDetails;
  currentUserID: Guid;
  currentUserName: string;
  currentUserRole = "";
  currentDisplayName: string;
  notificationSnackBarComponent: NotificationSnackBarComponent;
  isProgressBarVisibile: boolean;
  searchText = "";
  selectedPartnerID: string;
  selection = new SelectionModel<any>(true, []);
  todayDate: any;
  selectedFact: BPCFact;
  selectedAIACT: BPCOFAIACT;
  facts: BPCFact[] = [];
  actions: BPCOFAIACT[] = [];
  notifications: BPCOFAIACT[] = [];
  notificationCount: number;
  aIACTs: BPCOFAIACT[] = [];
  aIACTsView: BPCOFAIACT[] = [];
  SetIntervalID: any;
  constructor(
      private _factService: FactService,
      private _masterService: MasterService,
      private _dashboardService: DashboardService,
      private _router: Router,
      public snackBar: MatSnackBar,
      private dialog: MatDialog
  ) {
      this.selectedFact = new BPCFact();
      this.selectedAIACT = new BPCOFAIACT();
      this.authenticationDetails = new AuthenticationDetails();
      this.notificationSnackBarComponent = new NotificationSnackBarComponent(
          this.snackBar
      );
      this.isProgressBarVisibile = false;
      this.todayDate = new Date().getDate();
  }

  ngOnInit(): void {
      const retrievedObject = localStorage.getItem("authorizationData");
      this.authenticationDetails = JSON.parse(
          retrievedObject
      ) as AuthenticationDetails;
      if (retrievedObject) {
          this.authenticationDetails = JSON.parse(
              retrievedObject
          ) as AuthenticationDetails;
          this.currentUserID = this.authenticationDetails.UserID;
          this.currentUserName = this.authenticationDetails.UserName;
          this.currentUserRole = this.authenticationDetails.UserRole;
          this.currentDisplayName = this.authenticationDetails.DisplayName;
          this.menuItems = this.authenticationDetails.MenuItemNames.split(
              ","
          );
          if (this.menuItems.indexOf("Dashboard") < 0) {
              this.notificationSnackBarComponent.openSnackBar(
                  "You do not have permission to visit this page",
                  SnackBarStatus.danger
              );
              this._router.navigate(["/auth/login"]);
          }
          this.CreateAppUsage();
          this.GetFactByPartnerIDAndType();
          this.GetActionsByPartnerID();
          this.GetNotificationsByPartnerID();
          // this.SetIntervalID = setInterval(() => {
          //   this.GetNotificationsByPartnerID();
          // }, 10000);
          // this.openTourScreenDialog();

        //   if (!this.authenticationDetails.TourStatus) {
        //       this.openTourScreenDialog();
        //   }
      } else {
          this._router.navigate(["/auth/login"]);
      }
  }

  openTourScreenDialog(): void {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.width = "50%";
      this.dialog.open(TourComponent, dialogConfig);
  }

  CreateAppUsage(): void {
      const appUsage: AppUsage = new AppUsage();
      appUsage.UserID = this.currentUserID;
      appUsage.AppName = "Dashboard";
      appUsage.UsageCount = 1;
      appUsage.CreatedBy = this.currentUserName;
      appUsage.ModifiedBy = this.currentUserName;
      this._masterService.CreateAppUsage(appUsage).subscribe(
          () => {},
          (err) => {
              console.error(err);
          }
      );
  }

  GetFactByPartnerIDAndType(): void {
      this._factService
          .GetFactByPartnerIDAndType(this.currentUserName, "V")
          .subscribe(
              (data) => {
                  const fact = data as BPCFact;
                  this.loadSelectedFact(fact);
              },
              (err) => {
                  console.error(err);
              }
          );
  }

  GetAIACTsByPartnerID(PartnerID: any): void {
      this.isProgressBarVisibile = true;
      this._dashboardService.GetAIACTsByPartnerID(PartnerID).subscribe(
          (data) => {
              this.isProgressBarVisibile = false;
              this.aIACTs = data as BPCOFAIACT[];
              this.aIACTs.forEach((x) => {
                  if (x.Type === "Action") {
                      this.actions.push(x);
                  } else {
                      this.notifications.push(x);
                  }
              });
          },
          (err) => {
              console.error(err);
              this.isProgressBarVisibile = false;
              // this.notificationSnackBarComponent.openSnackBar(err instanceof Object ? 'Something went wrong' : err, SnackBarStatus.danger);
          }
      );
  }

  GetActionsByPartnerID(): void {
      this.isProgressBarVisibile = true;
      this._dashboardService
          .GetActionsByPartnerID(this.authenticationDetails.UserName)
          .subscribe(
              (data) => {
                  if (data) {
                      this.actions = data as BPCOFAIACT[];
                  }
                  this.isProgressBarVisibile = false;
              },
              (err) => {
                  console.error(err);
                  this.isProgressBarVisibile = false;
              }
          );
  }

  GetNotificationsByPartnerID(): void {
      this._dashboardService
          .GetNotificationsByPartnerID(this.authenticationDetails.UserName)
          .subscribe(
              (data) => {
                  if (data) {
                      this.notifications = data as BPCOFAIACT[];
                      this.notificationCount = this.notifications.length;
                  }
              },
              (err) => {
                  console.error(err);
              }
          );
  }

  UpdateNotification(selectedNotification: BPCOFAIACT): void {
      if (selectedNotification) {
          selectedNotification.HasSeen = true;
          this._dashboardService
              .UpdateNotification(selectedNotification)
              .subscribe(
                  () => {
                      this.GetNotificationsByPartnerID();
                  },
                  (err) => {
                      console.error(err);
                  }
              );
      }
  }

  AcceptAIACT(): void {
      this.selectedAIACT.ModifiedBy = this.authenticationDetails.UserID.toString();
      this.selectedAIACT.Status = "Accepted";
      this.selectedAIACT.ActionText = "View";
      this.isProgressBarVisibile = true;
      this._dashboardService.AcceptAIACT(this.selectedAIACT).subscribe(
          () => {
              this.notificationSnackBarComponent.openSnackBar(
                  "PO Accepted successfully",
                  SnackBarStatus.success
              );
              this.isProgressBarVisibile = false;
          },
          (err) => {
              console.error(err);
              this.notificationSnackBarComponent.openSnackBar(
                  err instanceof Object ? "Something went wrong" : err,
                  SnackBarStatus.danger
              );
              this.isProgressBarVisibile = false;
          }
      );
  }

  RejectAIACT(): void {
      this.selectedAIACT.ModifiedBy = this.authenticationDetails.UserID.toString();
      this.selectedAIACT.Status = "Rejected";
      this.selectedAIACT.ActionText = "View";
      this.isProgressBarVisibile = true;
      this._dashboardService.RejectAIACT(this.selectedAIACT).subscribe(
          () => {
              this.notificationSnackBarComponent.openSnackBar(
                  "PO Rejected successfully",
                  SnackBarStatus.success
              );
              this.isProgressBarVisibile = false;
          },
          (err) => {
              console.error(err);
              this.notificationSnackBarComponent.openSnackBar(
                  err instanceof Object ? "Something went wrong" : err,
                  SnackBarStatus.danger
              );
              this.isProgressBarVisibile = false;
          }
      );
  }

  AcceptAIACTs(): void {
      this.aIACTs.forEach((x) => {
          if (x.Status === "Open") {
              x.ModifiedBy = this.authenticationDetails.UserID.toString();
              x.Status = "Accepted";
              x.ActionText = "View";
              this.aIACTsView.push(x);
          }
      });
      this.isProgressBarVisibile = true;
      this._dashboardService.AcceptAIACTs(this.aIACTsView).subscribe(
          () => {
              this.notificationSnackBarComponent.openSnackBar(
                  "POs Accepted successfully",
                  SnackBarStatus.success
              );
              this.isProgressBarVisibile = false;
          },
          (err) => {
              console.error(err);
              this.notificationSnackBarComponent.openSnackBar(
                  err instanceof Object ? "Something went wrong" : err,
                  SnackBarStatus.danger
              );
              this.isProgressBarVisibile = false;
          }
      );
  }

  loadSelectedFact(selectedBPCFact: BPCFact): void {
      if (selectedBPCFact) {
          this.selectedFact = selectedBPCFact;
          this.selectedPartnerID = selectedBPCFact.PatnerID;
      }
  }

  openConfirmationDialog(Actiontype: string, Catagory: string): void {
      const dialogConfig: MatDialogConfig = {
          data: {
              Actiontype: Actiontype,
              Catagory: Catagory,
          },
          panelClass: "confirmation-dialog",
      };
      const dialogRef = this.dialog.open(
          NotificationDialogComponent,
          dialogConfig
      );
      dialogRef.afterClosed().subscribe((result) => {
          if (result) {
              if (Actiontype === "Accept") {
                  this.AcceptAIACT();
              } else if (Actiontype === "Reject") {
                  this.RejectAIACT();
              } else if (Actiontype === "Accept All") {
                  this.AcceptAIACTs();
              }
          }
      });
  }

  actionTextButtonClicked(aIACTByPartnerID: BPCOFAIACT): void {
      if (aIACTByPartnerID) {
          if (aIACTByPartnerID.ActionText.toLowerCase() === "accept") {
              this.selectedAIACT = aIACTByPartnerID;
              const Actiontype = "Accept";
              const Catagory = "PO";
              this.openConfirmationDialog(Actiontype, Catagory);
          } else if (aIACTByPartnerID.ActionText.toLowerCase() === "reject") {
              this.selectedAIACT = aIACTByPartnerID;
              const Actiontype = "Reject";
              const Catagory = "PO";
              this.openConfirmationDialog(Actiontype, Catagory);
          } else if (aIACTByPartnerID.ActionText.toLowerCase() === "view") {
              this._router.navigate(["/pages/polookup"], {
                  queryParams: { id: aIACTByPartnerID.DocNumber },
              });
          } else if (aIACTByPartnerID.ActionText.toLowerCase() === "ack") {
              this._router.navigate(["/pages/polookup"], {
                  queryParams: { id: aIACTByPartnerID.DocNumber },
              });
          } else if (aIACTByPartnerID.ActionText.toLowerCase() === "asn") {
              this._router.navigate(["/pages/asn"], {
                  queryParams: { id: aIACTByPartnerID.DocNumber },
              });
          } else if (aIACTByPartnerID.ActionText.toLowerCase() === "grn") {
              this._router.navigate(["/pages/polookup"], {
                  queryParams: { id: aIACTByPartnerID.DocNumber },
              });
          } else if (aIACTByPartnerID.ActionText.toLowerCase() === "gate") {
              this._router.navigate(["/pages/polookup"], {
                  queryParams: { id: aIACTByPartnerID.DocNumber },
              });
          }
      } else {
      }
  }

  noButtonClicked(): void {}

  setActionToOpenConfirmation(actiontype: string): void {
      if (this.selectedFact.PatnerID) {
          const Actiontype = actiontype;
          const Catagory = "Vendor";
          this.openConfirmationDialog(Actiontype, Catagory);
      }
  }

  numberOnly(event): boolean {
      const charCode = event.which ? event.which : event.keyCode;
      if (
          charCode === 8 ||
          charCode === 9 ||
          charCode === 13 ||
          charCode === 46 ||
          charCode === 37 ||
          charCode === 39 ||
          charCode === 123 ||
          charCode === 190
      ) {
          return true;
      } else if (charCode < 48 || charCode > 57) {
          return false;
      }
      return true;
  }

  onFactSheetButtonClicked(): void {
      this._router.navigate(["/fact"]);
  }

  onAcceptAllButtonClicked(): void {
      if (this.aIACTs && this.aIACTs.length > 0) {
          const Actiontype = "Accept All";
          const Catagory = "PO";
          this.openConfirmationDialog(Actiontype, Catagory);
      }
  }

  onClearAllButtonClicked(): void {}

  getTodayDate(): any {
      const today = new Date();
      return today.getDate().toString();
  }

  typeSelected(event): void {
      if (event.value) {
          this.selectedFact.Type = event.value;
      }
  }

  getActionData(element: BPCOFAIACT, actionDataFor: string): string {
      switch (actionDataFor) {
          case "actionFirstData":
              return element.Status === "DueForACK"
                  ? "acknowledge"
                  : element.Status === "DueForASN"
                  ? "ASN"
                  : element.Status === "DueForGate"
                  ? "GRN"
                  : element.Status === "DueForGRN"
                  ? "Gate"
                  : element.Status === "Accepted"
                  ? "Accept"
                  : element.Status === "Rejected"
                  ? "Reject"
                  : "";
          case "actionSecondData":
              return element.Status === "DueForACK"
                  ? "waiting for Acknowledgement "
                  : element.Status === "DueForASN"
                  ? "waiting for ASN"
                  : element.Status === "DueForGate"
                  ? "waiting for Gate"
                  : element.Status === "DueForGRN"
                  ? "waiting for GRN"
                  : "";
          default:
              return "";
      }
  }

}
