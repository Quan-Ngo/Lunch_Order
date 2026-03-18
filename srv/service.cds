using lunch from '../db/schema';

@path: '/odata/v4/lunch'
service LunchService {
    @restrict: [
        { grant: 'READ',   to: 'CMNA_READ_ASSIGNED_USER' },
        { grant: 'READ',   to: 'CMNA_READ_ALL_USER' },
        { grant: 'CREATE', to: 'CMNA_ADD_USER' },
        { grant: 'UPDATE', to: 'CMNA_UPDATE_USER' },
        { grant: 'DELETE', to: 'CMNA_DELETE_USER' }
    ]
    entity Catalog      as projection on lunch.Catalog {
        *,
        price    @(restrict: [{ to: 'CMNA_READ_ALL_USER' }]),
        currency @(restrict: [{ to: 'CMNA_READ_ALL_USER' }])
    };

    @restrict: [
        { grant: 'READ',   to: 'CMNA_READ_ASSIGNED_USER' },
        { grant: 'READ',   to: 'CMNA_READ_ALL_USER' },
        { grant: 'CREATE', to: 'CMNA_ADD_USER' },
        { grant: 'UPDATE', to: 'CMNA_UPDATE_USER' },
        { grant: 'DELETE', to: 'CMNA_DELETE_USER' }
    ]
    entity Staff        as projection on lunch.Staff;

    @restrict: [
        { grant: 'READ', to: 'CMNA_READ_ASSIGNED_USER' },
        { grant: 'READ', to: 'CMNA_READ_ALL_USER' },
        { grant: ['CREATE', 'UPDATE', 'DELETE'], to: 'CMNA_READ_ALL_USER' }
    ]
    entity DailyMenu    as projection on lunch.DailyMenu;

    @restrict: [
        { grant: ['READ', 'CREATE', 'DELETE'], to: 'CMNA_READ_ASSIGNED_USER' },
        { grant: '*', to: 'CMNA_READ_ALL_USER' }
    ]
    entity StaffCatalog as projection on lunch.StaffCatalog;

    @restrict: [
        { grant: 'READ',   to: 'CMNA_READ_ASSIGNED_USER' },
        { grant: 'READ',   to: 'CMNA_READ_ALL_USER' },
        { grant: 'CREATE', to: 'CMNA_ADD_USER' },
        { grant: 'UPDATE', to: 'CMNA_UPDATE_USER' },
        { grant: 'DELETE', to: 'CMNA_DELETE_USER' }
    ]
    entity CatalogFile  as projection on lunch.CatalogFile;

    @restrict: [
        { grant: 'READ',   to: 'CMNA_READ_ALL_USER' },
        { grant: 'CREATE', to: 'CMNA_ADD_USER' },
        { grant: 'DELETE', to: 'CMNA_DELETE_USER' }
    ]
    entity DailyOrderBill as projection on lunch.DailyOrderBill;

    @readonly
    @restrict: [{ grant: 'READ', to: 'CMNA_READ_ALL_USER' }]
    entity DailyCatalogStatistics as projection on lunch.DailyCatalogStatistics;

    @readonly
    @restrict: [{ grant: 'READ', to: 'CMNA_READ_ALL_USER' }]
    entity DailyOrderSummary as projection on lunch.DailyOrderSummary;

    @restrict: [{ grant: '*', to: 'CMNA_READ_ALL_USER' }]
    action grantAdminRole(userEmail : String) returns String;

    action extractMenuFromImage(image : LargeString, mimeType : String) returns String;

    @restrict: [{ grant: '*', to: 'CMNA_READ_ALL_USER' }]
    function getBtpUsers() returns String;

    function userInfo() returns String;
    action confirmMenu(date : String, orderOpens: Timestamp, orderCloses: Timestamp) returns String;
    action confirmOrder(date : String, supplierEmail : String) returns String;
    function getCurrentUser() returns String;
}
