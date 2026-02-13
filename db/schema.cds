namespace lunch;

using { cuid, managed } from '@sap/cds/common';

entity Staff : cuid, managed {
    Name         : String(100);
    Notification : Boolean;
    catalogs     : Association to many StaffCatalog on catalogs.staff = $self;
}

entity Catalog : cuid, managed {
    Name         : String(100);
    isActive     : Boolean;
    Price        : Decimal(15,2);
    Description  : String(500); // Added to support existing UI
    Category     : String(50);  // Added to support existing UI
    menus        : Association to many DailyMenu on menus.catalog = $self;
    staffCatalogs: Association to many StaffCatalog on staffCatalogs.catalog = $self;
    file         : Composition of one CatalogFile on file.catalog = $self;
}

entity CatalogFile : cuid, managed {
    url          : String(2048);
    content      : LargeBinary;
    mediaType    : String;
    catalog      : Association to Catalog;
}

entity DailyMenu : cuid, managed {
    Date         : Date;
    isComplete   : Boolean;
    catalog      : Association to Catalog; // "Association to many DailyMenu" implies Catalog -> DailyMenu 1:n? Or n:m? User said "Association to many DailyMenu" in Catalog. So DailyMenu has one Catalog?
    parent       : Association to DailyMenu; // "Association to one DailyMenu"
}

entity StaffCatalog : managed {
    key Staff_ID   : UUID;
    key Catalog_ID : UUID;
    Date           : Date;
    staff          : Association to Staff on staff.ID = Staff_ID;
    catalog        : Association to Catalog on catalog.ID = Catalog_ID;
}
