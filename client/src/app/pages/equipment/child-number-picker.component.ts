import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'angular2-child-number-picker',
  template: `
    <span class="input-group">  
      <div class="input-group-btn">
        <button class="btn_change_minus" (click)="decreaseValue()">-</button>
      </div>
      <input [formControl]="numberPicker" type="text" min="{{min}}" max="{{max}}" pattern="{{pattern}}"/>  
      <div class="input-group-btn">
        <button class="btn_change_add" (click)="increaseValue()">+</button>
      </div>
    </span>
  `,
  styles: [`
    input[type=text]::-webkit-inner-spin-button, 
    input[type=text]::-webkit-outer-spin-button { 
      
    }
    input[type=text] {
			border: 0px;
			border-top: solid 1px #979797;
			border-bottom: solid 1px #979797;
			height:32px;
			width: 100%;
			text-align: center;
		}
		.btn_change_add {
			background: none;
			color: #5EC3AE;
			padding: 0px;
			height: 32px;
			width: 32px;
			font-size: 20px;
			border: solid 1px #979797;
			border-left: 0px;
			border-radius: 5px;
			border-top-left-radius: 0px;
			border-bottom-left-radius: 0px;
		}

		.btn_change_minus {
			background: none;
			color: #5EC3AE;
			padding: 0px;
			height: 32px;
			width: 32px;
			font-size: 20px;
			border: solid 1px #979797;
			border-right: 0px;
			border-radius: 5px;
			border-top-right-radius: 0px;
			border-bottom-right-radius: 0px;
		}
  `]
})
export class ChildNumberPickerComponent implements OnInit {
	@Input() min: number;
	@Input() max: number;
	@Input() step: number;
	@Input() precision: number;
	@Input() inputDisabled: boolean;
	@Output() onChange: EventEmitter<number> = new EventEmitter();

	private numberPicker: FormControl;	

	constructor() {}

	ngOnInit() {		
		if(this.inputDisabled == null) {
			this.inputDisabled = false;
		}		
    if(this.min == null) {
      this.min = 0;
    }
    if(this.max == null) {
      this.max = 100;
    }
    if(this.precision == null) {
      this.precision = 1;
    }
    if(this.step == null) {
      this.step = 1;
    }

		this.numberPicker = new FormControl({value: this.min, disabled: this.inputDisabled});
		this.numberPicker.registerOnChange(() => {
			this.onChange.emit(this.numberPicker.value);
		});
  	}

  	private increaseValue(): void{
  		var currentValue = this.numberPicker.value;
  		if(currentValue < this.max) {
  			currentValue = currentValue+this.step;
  			if(this.precision != null) {
  				currentValue = this.round(currentValue, this.precision);
  			}
  			this.numberPicker.setValue(currentValue);
  		}
  	}

  	private decreaseValue(): void {
  		var currentValue = this.numberPicker.value;
  		if(currentValue > this.min) {
  			currentValue = currentValue-this.step;
  			if(this.precision != null) {
  				currentValue = this.round(currentValue, this.precision);
  			}
  			this.numberPicker.setValue(currentValue);
  		}
  	}

  	private round(value:number, precision:number): number {
  		let multiplier : number = Math.pow(10, precision || 0);
    	return Math.round(value * multiplier) / multiplier;
  	}

  	public getValue(): number {
  		return this.numberPicker.value;
  	}
}