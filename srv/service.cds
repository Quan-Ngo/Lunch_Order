using lunch from '../db/schema';

@path: '/odata/v4/lunch'
service LunchService {
    entity Catalog      as projection on lunch.Catalog;
    
    entity Staff        as projection on lunch.Staff;

    entity DailyMenu    as projection on lunch.DailyMenu;
    entity StaffCatalog as projection on lunch.StaffCatalog;
    entity CatalogFile  as projection on lunch.CatalogFile;
    entity DailyOrderBill as projection on lunch.DailyOrderBill;
    @readonly
    entity DailyCatalogStatistics as projection on lunch.DailyCatalogStatistics;
    @readonly
    entity DailyOrderSummary as projection on lunch.DailyOrderSummary;

    action grantAdminRole(userEmail : String) returns String;
}
