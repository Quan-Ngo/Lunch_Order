using lunch from '../db/schema';

service LunchService @(path: '/odata/v4/lunch') {
    entity Catalog      as projection on lunch.Catalog;
    entity Staff        as projection on lunch.Staff;
    entity DailyMenu    as projection on lunch.DailyMenu;
    entity StaffCatalog as projection on lunch.StaffCatalog;
    entity CatalogFile  as projection on lunch.CatalogFile;
}
