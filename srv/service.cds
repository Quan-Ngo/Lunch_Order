using lunch from '../db/schema';

@path: '/odata/v4/lunch'
service LunchService {
    @restrict: [{ grant: '*', to: 'CMNA_ADMIN' }]
    entity Catalog      as projection on lunch.Catalog;

    @restrict: [{ grant: '*', to: 'CMNA_ADMIN' }]
    entity Staff        as projection on lunch.Staff;

    @restrict: [
        { grant: 'READ', to: 'CMNA_READ_ASSIGNED_USER' },
        { grant: '*', to: 'CMNA_ADMIN' }
    ]
    entity DailyMenu    as projection on lunch.DailyMenu;

    @restrict: [
        { grant: ['READ', 'CREATE', 'DELETE'], to: 'CMNA_READ_ASSIGNED_USER' },
        { grant: '*', to: 'CMNA_ADMIN' }
    ]
    entity StaffCatalog as projection on lunch.StaffCatalog;

    @restrict: [{ grant: '*', to: 'CMNA_ADMIN' }]
    entity CatalogFile  as projection on lunch.CatalogFile;

    @restrict: [{ grant: '*', to: 'CMNA_ADMIN' }]
    entity DailyOrderBill as projection on lunch.DailyOrderBill;

    @readonly
    @restrict: [{ grant: 'READ', to: 'CMNA_ADMIN' }]
    entity DailyCatalogStatistics as projection on lunch.DailyCatalogStatistics;

    @readonly
    @restrict: [{ grant: 'READ', to: 'CMNA_ADMIN' }]
    entity DailyOrderSummary as projection on lunch.DailyOrderSummary;

    @restrict: [{ grant: '*', to: 'CMNA_ADMIN' }]
    action grantAdminRole(userEmail : String) returns String;

    @restrict: [{ grant: '*', to: 'CMNA_ADMIN' }]
    function getBtpUsers() returns String;

    function userInfo() returns String;
}
