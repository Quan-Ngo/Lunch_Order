import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { RegisterEmployeeModal } from '@/components/fragments/RegisterEmployeeModal';
import { EditEmployeeModal } from '@/components/fragments/EditEmployeeModal';
import { RemovalModal } from '@/components/fragments/RemovalModal';

export default function Employees() {
    const { t } = useTranslation();
    const { employees, isLoading, error, refetch } = useEmployees();
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [togglingEmployeeIds, setTogglingEmployeeIds] = useState<Set<string>>(new Set());
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<StaffEntity | null>(null);
    const [removingEmployee, setRemovingEmployee] = useState<StaffEntity | null>(null);

    const totalEmployees: number = employees?.length ?? 0;
    const activeAccounts: number = employees?.filter((employee) => employee.status).length ?? 0;
    const existingEmployeeNames = useMemo(() => employees?.map(e => e.name) ?? [], [employees]);

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

    const handleRegisterSuccess = useCallback(() => {
        void refetch();
    }, [refetch]);

    const handleEditSave = useCallback(async (id: string, data: { name: string; status: boolean; notification: boolean }) => {
        try {
            await employeeService.update(id, data);
            await refetch();
        } catch (err) {
            console.error('Failed to update employee:', err);
            throw err;
        }
    }, [refetch]);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await employeeService.delete(id);
            await refetch();
            setRemovingEmployee(null);
        } catch (err) {
            console.error('Failed to delete employee:', err);
            throw err; // Propagate to modal to show error
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
            header: t('employees.table.name'),
            key: 'name',
            className: 'col-span-4 text-sm font-semibold text-gray-800',
        },
        {
            header: t('employees.table.status'),
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
                    activeLabel={t('employees.status.active')}
                    inactiveLabel={t('employees.status.inactive')}
                    disabled={togglingEmployeeIds.has(row.ID)}
                    className={`${row.status ? 'text-green-600' : 'text-gray-500'} border-white text-[0.60rem] shadow-none hover:shadow-none active:shadow-none transition-none active:translate-x-0 active:translate-y-0 focus:ring-0 focus:ring-offset-0`}
                />
            ),
        },
        {
            header: t('employees.table.actions'),
            className: 'col-span-4 flex justify-end',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" className="border-0 bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-0 focus:ring-offset-0 shadow-none hover:shadow-none" onClick={() => { }}>
                        {t('employees.actions.grantAdmin')}
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="border-0 bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-0 focus:ring-offset-0 shadow-none hover:shadow-none"
                        onClick={() => setEditingEmployee(row)}
                    >
                        {t('employees.actions.edit')}
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        className="shadow-none hover:shadow-none"
                        onClick={() => setRemovingEmployee(row)}
                    >
                        {t('employees.actions.delete')}
                    </Button>
                </div>
            ),
        },
    ], [handleToggleStatus, togglingEmployeeIds, t]);

    return (
        <RootLayout>
            <PageHeader
                title={t('employees.title')}
                description={t('employees.description')}
            >
                <Button
                    variant="primary"
                    icon={<span className="material-icons-outlined">person_add</span>}
                    onClick={() => setIsRegisterModalOpen(true)}
                >
                    {t('employees.registerNew')}
                </Button>
            </PageHeader>

            <RegisterEmployeeModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                onSuccess={handleRegisterSuccess}
                existingEmployeeNames={existingEmployeeNames}
            />

            <EditEmployeeModal
                isOpen={!!editingEmployee}
                onClose={() => setEditingEmployee(null)}
                onSave={handleEditSave}
                employee={editingEmployee}
            />

            <RemovalModal
                isOpen={!!removingEmployee}
                onClose={() => setRemovingEmployee(null)}
                onConfirm={handleDelete}
                item={removingEmployee ? { id: removingEmployee.ID, name: removingEmployee.name, email: removingEmployee.email } : null}
                variant="employee"
            />

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <SoftCard>
                    <p className="text-sm text-gray-500 font-medium mb-1">{t('employees.stats.total')}</p>
                    <p className="text-3xl font-extrabold font-display text-gray-900">{totalEmployees}</p>
                </SoftCard>
                <SoftCard>
                    <p className="text-sm text-gray-500 font-medium mb-1">{t('employees.stats.active')}</p>
                    <p className="text-3xl font-extrabold font-display text-gray-900">{activeAccounts}</p>
                </SoftCard>
            </div>

            <SoftCard className="mb-4">
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder={t('employees.searchPlaceholder')}
                    className="md:w-1/3"
                />
            </SoftCard>

            {/* Content states */}
            {isLoading && <LoadingState />}

            {error && (
                <ErrorState
                    message={t('employees.error.title')}
                    description={<>{t('employees.error.description')}</>}
                />
            )}

            {employees && filteredEmployees && filteredEmployees.length > 0 && (
                <Table<StaffEntity>
                    columns={columns}
                    data={filteredEmployees}
                    keyExtractor={(row) => row.ID}
                />
            )}

            {employees && employees.length === 0 && (
                <EmptyState
                    icon="group_off"
                    message={t('employees.empty.noData')}
                />
            )}

            {employees && employees.length > 0 && filteredEmployees && filteredEmployees.length === 0 && (
                <EmptyState
                    icon="search_off"
                    message={t('employees.empty.noResults')}
                />
            )}
        </RootLayout>
    );
}
