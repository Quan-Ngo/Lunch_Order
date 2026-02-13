namespace lunch;

using { cuid, managed } from '@sap/cds/common';

entity Food : cuid, managed {
    name        : String(100)  @mandatory;
    description : String(500);
    price       : Decimal(10,2) @mandatory;
    image       : String(2048);
    category    : String(50);
}

entity Employees : cuid, managed {
    name        : String(100)  @mandatory;
    email       : String(255)  @mandatory;
    department  : String(100);
}

entity DailyMenus : cuid, managed {
    date        : Date         @mandatory;
    items       : Composition of many DailyMenuItems on items.menu = $self;
}

entity DailyMenuItems : cuid {
    menu        : Association to DailyMenus;
    food        : Association to Food;
}

entity Orders : cuid, managed {
    date        : Date         @mandatory;
    employee    : Association to Employees;
    items       : Composition of many OrderItems on items.order = $self;
    totalAmount : Decimal(10,2);
    status      : String(20) default 'Pending';
}

entity OrderItems : cuid {
    order       : Association to Orders;
    food        : Association to Food;
    quantity    : Integer default 1;
    unitPrice   : Decimal(10,2);
    subtotal    : Decimal(10,2);
}
