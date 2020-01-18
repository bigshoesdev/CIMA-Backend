import { Component, OnInit, Input, OnChanges, ElementRef, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
  selector: 'app-monthpicker',
  templateUrl: './monthpicker.component.html',
  styleUrls: ['./monthpicker.component.scss']
})

export class MonthpickerComponent implements OnInit, OnChanges {

  model = "";
  @Input() config: ImonthPickerConfig;
  @Output() modelChange  = new EventEmitter();
  __monthPicker: monthPicker;
  constructor(private _elementRef: ElementRef) {
      this.__monthPicker = new monthPicker();
  }
  ngOnInit() {
  }
  ngOnChanges(changes:any) {
      if (this.model) {
          this.__monthPicker.setCurrentdate(new Date(this.model));
      }
  }

  onCalendarIconClick() {
      this.switchToMonthMode();
      this.__monthPicker.setCurrentdate(this.model ? new Date(this.model):new Date());
      this.__monthPicker.toggleState();
  }
  switchToYearMode() {
      this.__monthPicker.viewMode = 'y';
      this.__monthPicker.fillYearsInSelectionList();
  }
  switchToMonthMode() {
      this.__monthPicker.viewMode = 'm';
      this.__monthPicker.fillMonthsInSelectionList();
  }
  onselectionItemClick(item: IDatePickerSelectionItem) {
      if (item.type == 'y') {
          this.__monthPicker.displayYear = item.value;
          this.switchToMonthMode();
      } else if (item.type == 'm') {
          this.onSelectMonth(item);
      }
  }
  onSelectMonth(item: IDatePickerSelectionItem) {
      this.__monthPicker.displayMonth = item.text;
      this.__monthPicker.displayMonthIndex = item.value;

      this.__monthPicker.selectedMonth = item.text;
      this.__monthPicker.selectedMonthIndex = item.value;
      this.__monthPicker.selectedYear = this.__monthPicker.displayYear;

      this.model = this.__monthPicker.selectedYear + "/" + (((this.__monthPicker.selectedMonthIndex + 1) < 10) ? ('0' + (this.__monthPicker.selectedMonthIndex + 1)): (this.__monthPicker.selectedMonthIndex + 1)) + "/01";
      //this.model = new Date(this.__monthPicker.selectedYear, this.__monthPicker.selectedMonthIndex, 1);
      this.__monthPicker.state = "closed";
      this.modelChange.next(this.model);
  }

  onPrevYearSelection() {
      this.__monthPicker.displayYear--;
      if (this.__monthPicker.viewMode == 'y') { this.__monthPicker.fillYearsInSelectionList(); }
  }
  onNextYearSelection() {
      this.__monthPicker.displayYear++;
      if (this.__monthPicker.viewMode == 'y') { this.__monthPicker.fillYearsInSelectionList(); }
  }

  onCancel() {
      this.__monthPicker.state = "closed";
  }

  @HostListener('document:click', ['$event', '$event.target'])
  public onClick(event: MouseEvent, targetElement: HTMLElement): void {
      if (!targetElement) {
          return;
      }

      const clickedInside = this._elementRef.nativeElement.contains(targetElement);
      if (!clickedInside) {
          this.__monthPicker.state = "closed";
      }
  }
}
export interface ImonthPickerConfig {
  readonly?: boolean;
  cssClass?: string;
  placeHolder?: string;
}
export interface IDatePickerSelectionItem {
  text: string;
  value: number;
  type: string;
}
class monthPicker {
  state: string;
  selectionItems: Array<IDatePickerSelectionItem>;
  selectedMonth: string;
  selectedMonthIndex: number;
  selectedYear: number;
  displayMonth: string;
  displayMonthIndex: number;
  displayYear: number;
  viewMode: string;
  private months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  constructor() {
      this.state = "closed";
      this.viewMode = 'm';
      this.fillMonthsInSelectionList();
      let currentDate = new Date();
      this.setCurrentdate(currentDate);
  }
  toggleState() {
      this.state = this.state == "closed" ? "open" : "closed";
  }

  fillMonthsInSelectionList() {
      this.selectionItems = [];
      this.months.forEach((v: string, i: number) => this.selectionItems.push({ text: v, value: i, type: 'm' }));
  }
  fillYearsInSelectionList() {
      this.selectionItems = [];
      for (let start = this.displayYear - 6; start <= this.displayYear + 5; start++) {
          this.selectionItems.push({ text: start.toString(), value: start, type: 'y' });
      }
  }
  setCurrentdate(currentDate: Date)
  {
      this.displayMonth = this.months[(currentDate.getMonth())];
      this.displayMonthIndex = currentDate.getMonth();
      this.displayYear = currentDate.getFullYear();

      this.selectedMonth = this.displayMonth;
      this.selectedMonthIndex = this.displayMonthIndex;
      this.selectedYear = this.displayYear;
  }

}
