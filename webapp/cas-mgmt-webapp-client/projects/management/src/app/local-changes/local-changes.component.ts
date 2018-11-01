import {Component, OnInit, ViewChild} from '@angular/core';
import {Change, PaginatorComponent} from 'mgmt-lib';
import {ControlsService} from '../controls/controls.service';
import {MatDialog, MatSnackBar, MatTableDataSource} from '@angular/material';
import {RevertComponent} from '../revert/revert.component';
import {ServiceViewService} from '../services/service.service';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-local-changes',
  templateUrl: './local-changes.component.html',
  styleUrls: ['./local-changes.component.css']
})
export class LocalChangesComponent implements OnInit {

  selectedItem: Change;
  revertItem: Change;
  displayedColumns = ['actions', 'serviceName', 'changeType'];
  datasource: MatTableDataSource<Change>;
  loading: boolean;

  @ViewChild(PaginatorComponent)
  paginator: PaginatorComponent;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private controlsService: ControlsService,
              private service: ServiceViewService,
              public dialog: MatDialog,
              public snackBar: MatSnackBar) { }

  ngOnInit() {
    this.route.data.subscribe((data: {resp: Change[]}) => {
      this.datasource = new MatTableDataSource(data.resp);
      this.datasource.paginator = this.paginator.paginator;
    });
  }

  refresh() {
    this.loading = true;
    this.controlsService.untracked()
      .subscribe(
        resp => {
          this.datasource.data = resp ? resp : [];
          this.loading = false;
        },
        () => this.loading = false
      );
    this.controlsService.gitStatus();
  }

  openModalRevert() {
    const dialogRef = this.dialog.open(RevertComponent, {
      data: this.selectedItem,
      width: '500px',
      position: {top: '100px'}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.revert();
      }
    });
    this.revertItem = this.selectedItem;
  };

  revert() {
    const fileName: string = (this.revertItem.fileName).replace(/ /g, '');
    if (this.revertItem.changeType === 'ADD') {
      this.service.deleteService(+this.revertItem.id)
        .subscribe(resp => this.handleRevert());
    } else {
      this.service.revert(this.revertItem.oldId as string)
        .subscribe(resp => this.handleRevert());
    }
  }

  handleRevert() {
    this.refresh();
    this.snackBar
      .open('Change has been reverted',
        'Dismiss',
        {duration: 5000}
      );
  }

  viewDiff() {
    this.router.navigate(['/diff', {oldId: this.selectedItem.oldId, newId: this.selectedItem.newId}]);
  }

  viewJSON() {
    const id = this.selectedItem.changeType === 'DELETE' ? this.selectedItem.oldId : this.selectedItem.newId;
    this.router.navigate(['/viewJson', id]);
  }

}