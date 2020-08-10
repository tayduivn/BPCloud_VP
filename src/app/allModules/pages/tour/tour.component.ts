import { TourStatusModel } from "app/models/TourStatusModel";
import { AuthenticationDetails } from "app/models/master";
import { AuthService } from "app/services/auth.service";
import { Component, OnInit } from "@angular/core";
import { MatCarousel, MatCarouselComponent } from "@ngmodule/material-carousel";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: "app-tour",
    templateUrl: "./tour.component.html",
    styleUrls: ["./tour.component.scss"],
})
export class TourComponent implements OnInit {
    authenticationDetails: AuthenticationDetails;
    tourStatus: TourStatusModel = {
        TourStatus: false,
    };
    isFinal = true;
    slides = [
        {
            image: "assets/images/BPCloud1.png",
            header: "We are very excited to have you onboard!",
            data: `We help you to manage, monitor, create and keep account of your
            inventories better than other platforms.`,
        },
        {
            image: "assets/images/Image.jpg",
            header: "Header3",
            data: `Create, manage and monitor your and your teams inventories with priority,
            comments, deadlines, associated issues, risks ans meetings.`,
        },
    ];

    constructor(
        private dialogRef: MatDialogRef<TourComponent>,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        const retrievedObject = localStorage.getItem("authorizationData");
        this.authenticationDetails = JSON.parse(
            retrievedObject
        ) as AuthenticationDetails;
    }

    close(): void {
        this.tourStatus.UserId = this.authenticationDetails.UserID;
        this.tourStatus.TourStatus = this.isFinal;
        this.authService
            .SetApplicationTourDisabled(this.tourStatus)
            .subscribe((data) => {
                this.authenticationDetails.TourStatus = this.isFinal;
                localStorage.setItem(
                    "authorizationData",
                    JSON.stringify(this.authenticationDetails)
                );

                this.dialogRef.close();
            });
    }
}
