import type { ClientEntity, ClientFilterState } from './types'

export const clientSelectors = {
    filterClients: (clients: ClientEntity[], filters: ClientFilterState): ClientEntity[] => {
        return clients.filter(client => {
            const matchesSearch = !filters.search || 
                client.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                client.name_short.toLowerCase().includes(filters.search.toLowerCase()) ||
                client.login.toLowerCase().includes(filters.search.toLowerCase()) ||
                (client.document_code && client.document_code.toLowerCase().includes(filters.search.toLowerCase())) ||
                (client.tax_code && client.tax_code.toLowerCase().includes(filters.search.toLowerCase())) ||
                (client.contact && client.contact.toLowerCase().includes(filters.search.toLowerCase()))

            const matchesClientType = !filters.client_type || 
                client.client_type === filters.client_type

            const matchesHasTaxCode = filters.has_tax_code === undefined || 
                (filters.has_tax_code ? !!client.tax_code : !client.tax_code)

            return matchesSearch && matchesClientType && matchesHasTaxCode
        })
    },

    sortClients: (clients: ClientEntity[], sortBy: keyof ClientEntity = 'name'): ClientEntity[] => {
        return [...clients].sort((a, b) => {
            const aVal = a[sortBy]
            const bVal = b[sortBy]
            
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return aVal.localeCompare(bVal)
            }
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return aVal - bVal
            }
            
            return 0
        })
    },

    getClientsByType: (clients: ClientEntity[], clientType: string): ClientEntity[] => {
        return clients.filter(client => client.client_type === clientType)
    },

    getClientsWithTaxCode: (clients: ClientEntity[]): ClientEntity[] => {
        return clients.filter(client => !!client.tax_code)
    },

    getActiveClients: (clients: ClientEntity[]): ClientEntity[] => {
        return clients.filter(client => !!client.login)
    }
}