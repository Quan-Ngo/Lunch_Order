import { useCallback, useMemo, useState } from 'react';
import { RootLayout } from '@/layouts/RootLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { PageHeader } from '@/components/elements/PageHeader';
import { SoftCard } from '@/components/elements/SoftCard';
import { SearchBar } from '@/components/elements/SearchBar';
import { Table, type ColumnDef } from '@/components/elements/Table';
import { ToggleActiveButton } from '@/components/elements/ToggleActiveButton';
import { LoadingState } from '@/components/elements/LoadingState';
import { ErrorState } from '@/components/elements/ErrorState';
import { EmptyState } from '@/components/elements/EmptyState';
import { Button } from '@/components/elements/Button';
import { employeeService, type StaffEntity } from '@/services/api';

export default function Employees() {
    const { employees, isLoading, error, refetch } = useEmployees();
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [togglingEmployeeIds, setTogglingEmployeeIds] = useState<Set<string>>(new Set());

    const totalEmployees: number = employees?.length ?? 0;
    const activeAccounts: number = employees?.filter((employee) => employee.status).length ?? 0;

    const handleToggleStatus = useCallback(async (employee: StaffEntity, nextStatus: boolean) => {
        setTogglingEmployeeIds((prev) => new Set(prev).add(employee.ID));
        try {
            await employeeService.setStatus(employee.ID, nextStatus);
            await refetch();
        } catch (err) {
            console.error('Failed to toggle employee status:', err);
        } finally {
            setTogglingEmployeeIds((prev) => {
                const next = new Set(prev);
                next.delete(employee.ID);
                return next;
            });
        }
    }, [refetch]);

    const filteredEmployees = useMemo(() => {
        if (!employees) return [];
        const query = searchTerm.toLowerCase().trim();
        if (!query) return employees;
        return employees.filter((employee) =>
            employee.name.toLowerCase().includes(query)
        );
    }, [employees, searchTerm]);

    const columns: ColumnDef<StaffEntity>[] = useMemo(() => [
        {
            header: 'Name',
            key: 'name',
            className: 'col-span-4 text-sm font-semibold text-gray-800',
        },
        {
            header: 'Status',
            className: 'col-span-4 ',
            render: (row) => (
                <ToggleActiveButton
                    isActive={row.status}
                    onActivate={() => {
                        void handleToggleStatus(row, true);
                    }}
                    onDeactivate={() => {
                        void handleToggleStatus(row, false);
                    }}
                    activeLabel="Active"
                    inactiveLabel="Inactive"
                    disabled={togglingEmployeeIds.has(row.ID)}
                    className={`${row.status ? 'text-green-600' : 'text-gray-500'} border-white text-[0.60rem] shadow-none hover:shadow-none active:shadow-none transition-none active:translate-x-0 active:translate-y-0 focus:ring-0 focus:ring-offset-0`}
                />
            ),
        },
        {
            header: 'Actions',
            className: 'col-span-4 flex justify-end',
            render: () => (
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" className="border-0 bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-0 focus:ring-offset-0 shadow-none hover:shadow-none" onClick={() => { }}>
                        Grant Admin
                    </Button>
                    <Button variant="secondary" size="sm" className="border-0 bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-0 focus:ring-offset-0 shadow-none hover:shadow-none" onClick={() => { }}>
                        Edit
                    </Button>
                    <Button variant="danger" size="sm" className="shadow-none hover:shadow-none" onClick={() => { }}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ], [handleToggleStatus, togglingEmployeeIds]);

    return (
        <RootLayout>
            <PageHeader
                title="Manage Employees"
                description="Manage team access and account status for office lunches."
            >
                <Button
                    variant="primary"
                    icon={<span className="material-icons-outlined">person_add</span>}
                >
                    Register New Employee
                </Button>
            </PageHeader>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <SoftCard>
                    <p className="text-sm text-gray-500 font-medium mb-1">Total Employees</p>
                    <p className="text-3xl font-extrabold font-display text-gray-900">{totalEmployees}</p>
                </SoftCard>
                <SoftCard>
                    <p className="text-sm text-gray-500 font-medium mb-1">Active Accounts</p>
                    <p className="text-3xl font-extrabold font-display text-gray-900">{activeAccounts}</p>
                </SoftCard>
            </div>

            <SoftCard className="mb-4">
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search employees by name"
                    className="md:w-1/3"
                />
            </SoftCard>

            {/* Content states */}
            {isLoading && <LoadingState />}

            {error && (
                <ErrorState
                    message="Unable to load employees"
                    description={<>Please check your connection and try again.</>}
                />
            )}

            {employees && filteredEmployees.length > 0 && (
                <Table<StaffEntity>
                    columns={columns}
                    data={filteredEmployees}
                    keyExtractor={(row) => row.ID}
                />
            )}

            {employees && employees.length === 0 && (
                <EmptyState
                    icon="group_off"
                    message="No employees found."
                />
            )}

            {employees && employees.length > 0 && filteredEmployees.length === 0 && (
                <EmptyState
                    icon="search_off"
                    message="No employees match your search."
                />
            )}
        </RootLayout>
    );
}


