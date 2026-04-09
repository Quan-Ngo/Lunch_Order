namespace lunch;

using { cuid, managed } from '@sap/cds/common';

entity Staff : cuid, managed {
    name         : String(100);
    email        : String(255);
    notification : Boolean default true;
    status       : Boolean default true;
    catalogs     : Association to many StaffCatalog on catalogs.staff = $self;
    menuInvites  : Association to many MenuInviteStaff on menuInvites.staff = $self;
}
annotate Staff with @(index: [{on: [email]}]);

entity Catalog : cuid, managed {
    name         : String(100);
    isActive     : Boolean;
    type         : String(20) default 'quick'; // daily or quick
    price        : Decimal(15,2);
    currency     : String(10) default 'VND'; // ISO 4217 e.g. 'VND', 'USD', 'EUR'
    description  : String(500); // Added to support existing UI
    category     : String(50);  // Added to support existing UI
    dailyMenu    : Association to DailyMenu;
    staffCatalogs: Association to many StaffCatalog on staffCatalogs.catalog = $self;
    file         : Composition of one CatalogFile on file.catalog = $self;
}

entity CatalogFile : cuid, managed {
    url          : String(2048);
    content      : LargeBinary @Core.MediaType: mediaType;
    mediaType    : String;
    catalog      : Association to Catalog;
}

entity DailyMenu : cuid, managed {
    date         : Date;
    name         : String(200);
    status       : String(10) default 'open'; // 'open', 'close', 'complete'
    orderOpens   : Timestamp;
    orderCloses  : Timestamp;
    isShare      : Boolean default true;
    additionalCost : Decimal(15,2) default 0;
    additionalCostCurrency : String(10) default 'VND';
    type         : String(20) default 'quick'; // daily or quick
    catalogs     : Association to many Catalog on catalogs.dailyMenu = $self;
    bills        : Association to many DailyOrderBill on bills.dailyMenu = $self;
    menuInvites  : Association to many MenuInviteStaff on menuInvites.dailyMenu = $self;
    staffOrders  : Association to many StaffCatalog on staffOrders.dailyMenu = $self;
    note         : String(500);
}
annotate DailyMenu with @(index: [{on: [date]}]);

entity MenuInviteStaff : managed {
    key DailyMenu_ID : UUID;
    key Staff_ID     : UUID;
    dailyMenu        : Association to DailyMenu on dailyMenu.ID = DailyMenu_ID;
    staff            : Association to Staff on staff.ID = Staff_ID;
}
annotate MenuInviteStaff with @(index: [{on: [DailyMenu_ID]}, {on: [Staff_ID]}]);

entity StaffCatalog : managed {
    key Staff_ID     : UUID;
    key Catalog_ID   : UUID;
    key DailyMenu_ID : UUID;
    key date         : Date;
    note             : String(500);
    staff            : Association to Staff on staff.ID = Staff_ID;
    catalog          : Association to Catalog on catalog.ID = Catalog_ID;
    dailyMenu        : Association to DailyMenu on dailyMenu.ID = DailyMenu_ID;
}
annotate StaffCatalog with @(index: [{on: [Staff_ID]}, {on: [DailyMenu_ID]}, {on: [date]}]);

entity DailyOrderBill : cuid, managed {
    date      : Date;
    fileName  : String(500);
    mediaType : String(100);
    content   : LargeBinary @Core.MediaType: mediaType;
    dailyMenu : Association to DailyMenu;
}

view DailyCatalogStatistics as
  select from lunch.StaffCatalog as SC
  inner join lunch.Catalog as C on SC.Catalog_ID = C.ID
  {
    key SC.date            as OrderDate,
    key C.ID               as CatalogID,
    C.name                 as CatalogName,
    C.price                as CatalogPrice,
    C.currency             as CatalogCurrency,
    C.description          as CatalogDescription,
    cast(count(*) as Integer)                          as OrderCount,
    cast(cast(count(*) as Decimal(15,2)) * C.price as Decimal(15,2)) as SubTotal
  }
  group by
    SC.date,
    C.ID,
    C.name,
    C.price,
    C.currency,
    C.description;

view DailyOrderSummary as
  select from DailyCatalogStatistics {
    key OrderDate,
    cast(sum(OrderCount) as Integer)       as TotalOrders,
    cast(sum(SubTotal) as Decimal(15,2))   as TotalAmount
  }
  group by
    OrderDate;
