using lunch from '../db/schema';

service LunchService @(path: '/odata/v4/lunch') {
    entity Food         as projection on lunch.Food;
    entity Employees    as projection on lunch.Employees;
    entity DailyMenus   as projection on lunch.DailyMenus;
    entity DailyMenuItems as projection on lunch.DailyMenuItems;
    entity Orders       as projection on lunch.Orders;
    entity OrderItems   as projection on lunch.OrderItems;
}
