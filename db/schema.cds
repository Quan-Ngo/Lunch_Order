namespace lunch;

using { cuid, managed } from '@sap/cds/common';

entity Staff : cuid, managed {
    name         : String(100);
    email        : String(255);
    notification : Boolean default true;
    status       : Boolean default true;
    catalogs     : Association to many StaffCatalog on catalogs.staff = $self;
}

entity Catalog : cuid, managed {
    name         : String(100);
    isActive     : Boolean;
    price        : Decimal(15,2);
    description  : String(500); // Added to support existing UI
    category     : String(50);  // Added to support existing UI
    menus        : Association to many DailyMenu on menus.catalog = $self;
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
    isComplete   : Boolean;
    catalog      : Association to Catalog; // "Association to many DailyMenu" implies Catalog -> DailyMenu 1:n? Or n:m? User said "Association to many DailyMenu" in Catalog. So DailyMenu has one Catalog?
    parent       : Association to DailyMenu; // "Association to one DailyMenu"
    note         : String(500);
}

entity StaffCatalog : managed {
    key Staff_ID   : UUID;
    key Catalog_ID : UUID;
    key date           : Date;
    staff          : Association to Staff on staff.ID = Staff_ID;
    catalog        : Association to Catalog on catalog.ID = Catalog_ID;
}

entity DailyOrderBill : cuid, managed {
    date      : Date;
    fileName  : String(500);
    mediaType : String(100);
    content   : LargeBinary @Core.MediaType: mediaType;
}

view DailyCatalogStatistics as
  select from lunch.StaffCatalog as SC
  inner join lunch.Catalog as C on SC.Catalog_ID = C.ID
  {
    key SC.date            as OrderDate,
    key C.ID               as CatalogID,
    C.name                 as CatalogName,
    C.price                as CatalogPrice,
    C.description          as CatalogDescription,
    cast(count(*) as Integer)                          as OrderCount,
    cast(cast(count(*) as Decimal(15,2)) * C.price as Decimal(15,2)) as SubTotal
  }
  group by
    SC.date,
    C.ID,
    C.name,
    C.price,
    C.description;

view DailyOrderSummary as
  select from DailyCatalogStatistics {
    key OrderDate,
    cast(sum(OrderCount) as Integer)       as TotalOrders,
    cast(sum(SubTotal) as Decimal(15,2))   as TotalAmount
  }
  group by
    OrderDate;
