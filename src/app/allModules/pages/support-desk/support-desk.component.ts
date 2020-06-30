import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort } from '@angular/material';
import { SupportHeader, SupportMaster } from 'app/models/support-desk';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { SupportDeskService } from 'app/services/support-desk.service';
import { AuthenticationDetails } from 'app/models/master';
import { Guid } from 'guid-typescript';
import { fuseAnimations } from '@fuse/animations';
import { NotificationSnackBarComponent } from 'app/notifications/notification-snack-bar/notification-snack-bar.component';
import { SnackBarStatus } from 'app/notifications/notification-snack-bar/notification-snackbar-status-enum';
@Component({
  selector: 'app-support-desk',
  templateUrl: './support-desk.component.html',
  styleUrls: ['./support-desk.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations
})
export class SupportDeskComponent implements OnInit {

  authenticationDetails: AuthenticationDetails;
  currentUserID: Guid;
  currentUserRole: string;
  MenuItems: string[];
  PartnerID: string;
  notificationSnackBarComponent: NotificationSnackBarComponent;
  IsProgressBarVisibile: boolean;
  SupportHeaders: SupportHeader[] = [];
  SelectedSupportHeader: SupportHeader = new SupportHeader();
  SupportDisplayedColumns: string[] = [
    'Reason',
    'Date',
    'Status',
    'AssignTo',
  ];
  SupportDataSource: MatTableDataSource<SupportHeader>;
  @ViewChild(MatPaginator) SupportPaginator: MatPaginator;
  @ViewChild(MatSort) SupportSort: MatSort;
  SupportMasters: SupportMaster[] = [];
  IsSupportHeader: boolean;

  constructor(
    private route: ActivatedRoute,
    public _supportdeskService: SupportDeskService,
    private _router: Router,
    private formBuilder: FormBuilder,
  ) {
    this.PartnerID = '';
    this.IsSupportHeader = false;
  }

  ngOnInit(): void {
    const retrievedObject = localStorage.getItem('authorizationData');
    if (retrievedObject) {
      this.authenticationDetails = JSON.parse(retrievedObject) as AuthenticationDetails;
      this.currentUserID = this.authenticationDetails.UserID;
      this.currentUserRole = this.authenticationDetails.UserRole;
      this.MenuItems = this.authenticationDetails.MenuItemNames.split(',');
      if (this.MenuItems.indexOf('SupportDesk') < 0) {
        this.notificationSnackBarComponent.openSnackBar('You do not have permission to visit this page', SnackBarStatus.danger
        );
        this._router.navigate(['/auth/login']);
      }

    } else {
      this._router.navigate(['/auth/login']);
    }
    this.GetSupportMastersByPartnerID();
    this.GetSupportTicketsByPartnerID();
  }

  GetSupportTicketsByPartnerID(): void {
    this.IsProgressBarVisibile = true;
    this._supportdeskService
      .GetSupportTicketsByPartnerID(this.authenticationDetails.UserName)
      .subscribe((data) => {
        if (data) {
          this.SupportHeaders = <SupportHeader[]>data;
          if (this.SupportHeaders && this.SupportHeaders.length === 0) {
            this.IsSupportHeader = true;
          }
          this.SupportDataSource = new MatTableDataSource(this.SupportHeaders);
          this.SupportDataSource.paginator = this.SupportPaginator;
          this.SupportDataSource.sort = this.SupportSort;
        }
        this.IsProgressBarVisibile = false;
      },
        (err) => {
          console.error(err);
          this.IsProgressBarVisibile = false;
        });
  }

  GetSupportMastersByPartnerID(): void {
    this.IsProgressBarVisibile = true;
    this._supportdeskService
      .GetSupportMastersByPartnerID(this.authenticationDetails.UserName)
      .subscribe((data) => {
        if (data) {
          this.SupportMasters = <SupportMaster[]>data;
        }
        this.IsProgressBarVisibile = false;
      },
        (err) => {
          console.error(err);
          this.IsProgressBarVisibile = false;
        });
  }

  AddSupportTicketClicked(): void {
    this._router.navigate(['/pages/supportticket']);
  }

  OnSupportHeaderRowClicked(row: any): void {
    this._router.navigate(['/pages/supportchat'], { queryParams: { SupportID: row.SupportID } });
  }
}