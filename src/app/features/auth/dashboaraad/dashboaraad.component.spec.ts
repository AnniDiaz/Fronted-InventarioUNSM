import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboaraadComponent } from './dashboaraad.component';

describe('DashboaraadComponent', () => {
  let component: DashboaraadComponent;
  let fixture: ComponentFixture<DashboaraadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboaraadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboaraadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
