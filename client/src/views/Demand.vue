<template>
  <div class="demand">
    <div class="page-header">
      <h2>{{ t('demand.title') }}</h2>
      <p>{{ t('demand.description') }}</p>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <!-- Page-level multi-select filters -->
      <div class="demand-filters">
        <div class="filter-section">
          <span class="filter-label">Trend</span>
          <div class="filter-tags">
            <button
              v-for="trend in ['increasing', 'stable', 'decreasing']"
              :key="trend"
              :class="['filter-tag', trend, { active: selectedTrends.includes(trend) }]"
              @click="toggleTrend(trend)"
            >
              {{ t(`trends.${trend}`) }}
            </button>
          </div>
        </div>
        <div class="filter-section">
          <span class="filter-label">Period</span>
          <div class="filter-tags">
            <button
              v-for="period in availablePeriods"
              :key="period"
              :class="['filter-tag', { active: selectedPeriods.includes(period) }]"
              @click="togglePeriod(period)"
            >
              {{ translatePeriod(period) }}
            </button>
          </div>
        </div>
        <button v-if="hasLocalFilters" class="clear-local-filters" @click="clearLocalFilters">
          {{ t('demand.clearFilters') }}
        </button>
      </div>

      <!-- Trend summary cards (reflect local filters via filteredForecasts) -->
      <div class="demand-trend-cards">
        <div class="trend-card increasing-card">
          <div class="trend-header">
            <div class="trend-icon">&#8593;</div>
            <div>
              <div class="trend-label">{{ t('demand.increasingDemand') }}</div>
              <div class="trend-count">{{ t('demand.itemsCount', { count: getForecastsByTrend('increasing').length }) }}</div>
            </div>
          </div>
          <div class="trend-items">
            <div v-for="item in getForecastsByTrend('increasing').slice(0, 5)" :key="item.id" class="trend-item">
              <span class="item-name">{{ item.item_name }}</span>
              <span class="item-change">+{{ getChangePercent(item) }}%</span>
            </div>
            <div v-if="getForecastsByTrend('increasing').length > 5" class="more-items">
              +{{ getForecastsByTrend('increasing').length - 5 }} {{ t('demand.more') }}
            </div>
          </div>
        </div>

        <div class="trend-card stable-card">
          <div class="trend-header">
            <div class="trend-icon">&#8594;</div>
            <div>
              <div class="trend-label">{{ t('demand.stableDemand') }}</div>
              <div class="trend-count">{{ t('demand.itemsCount', { count: getForecastsByTrend('stable').length }) }}</div>
            </div>
          </div>
          <div class="trend-items">
            <div v-for="item in getForecastsByTrend('stable').slice(0, 5)" :key="item.id" class="trend-item">
              <span class="item-name">{{ item.item_name }}</span>
              <span class="item-change neutral">{{ getChangePercent(item) }}%</span>
            </div>
            <div v-if="getForecastsByTrend('stable').length > 5" class="more-items">
              +{{ getForecastsByTrend('stable').length - 5 }} {{ t('demand.more') }}
            </div>
          </div>
        </div>

        <div class="trend-card decreasing-card">
          <div class="trend-header">
            <div class="trend-icon">&#8595;</div>
            <div>
              <div class="trend-label">{{ t('demand.decreasingDemand') }}</div>
              <div class="trend-count">{{ t('demand.itemsCount', { count: getForecastsByTrend('decreasing').length }) }}</div>
            </div>
          </div>
          <div class="trend-items">
            <div v-for="item in getForecastsByTrend('decreasing').slice(0, 5)" :key="item.id" class="trend-item">
              <span class="item-name">{{ item.item_name }}</span>
              <span class="item-change">{{ getChangePercent(item) }}%</span>
            </div>
            <div v-if="getForecastsByTrend('decreasing').length > 5" class="more-items">
              +{{ getForecastsByTrend('decreasing').length - 5 }} {{ t('demand.more') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Demand Forecasts card with view toggle -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('demand.demandForecasts') }}</h3>
          <div class="view-toggle">
            <button :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
              {{ t('demand.tableView') }}
            </button>
            <button :class="{ active: viewMode === 'kanban' }" @click="viewMode = 'kanban'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="5" height="18" rx="1"/>
                <rect x="10" y="3" width="5" height="12" rx="1"/>
                <rect x="17" y="3" width="5" height="15" rx="1"/>
              </svg>
              {{ t('demand.kanbanView') }}
            </button>
          </div>
        </div>

        <!-- Table view -->
        <div v-if="viewMode === 'table'" class="table-container">
          <table>
            <thead>
              <tr>
                <th>{{ t('demand.table.sku') }}</th>
                <th>{{ t('demand.table.itemName') }}</th>
                <th>{{ t('demand.table.currentDemand') }}</th>
                <th>{{ t('demand.table.forecastedDemand') }}</th>
                <th>{{ t('demand.table.change') }}</th>
                <th>{{ t('demand.table.trend') }}</th>
                <th>{{ t('demand.table.period') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="forecast in filteredForecasts" :key="forecast.id">
                <td><strong>{{ forecast.item_sku }}</strong></td>
                <td>{{ forecast.item_name }}</td>
                <td>{{ forecast.current_demand }}</td>
                <td><strong>{{ forecast.forecasted_demand }}</strong></td>
                <td>
                  <span :style="{ color: getChangeColor(forecast) }">
                    {{ getChangePercent(forecast) }}%
                  </span>
                </td>
                <td>
                  <span :class="['badge', forecast.trend]">
                    {{ t(`trends.${forecast.trend}`) }}
                  </span>
                </td>
                <td>{{ translatePeriod(forecast.period) }}</td>
              </tr>
              <tr v-if="filteredForecasts.length === 0">
                <td colspan="7" class="table-empty">{{ t('demand.noItems') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Kanban view -->
        <div v-else class="kanban-board">
          <!-- Increasing column -->
          <div class="kanban-column increasing-col">
            <div class="kanban-column-header">
              <span class="column-icon">&#8593;</span>
              <span class="column-title">{{ t('demand.increasingDemand') }}</span>
              <span class="column-count">{{ kanbanIncreasing.length }}</span>
            </div>
            <div class="kanban-cards">
              <div v-for="item in kanbanIncreasing" :key="item.id" class="kanban-card">
                <div class="kanban-card-header">
                  <span class="kanban-sku">{{ item.item_sku }}</span>
                  <span class="kanban-change increasing">{{ getChangePercent(item) }}%</span>
                </div>
                <div class="kanban-card-name">{{ item.item_name }}</div>
                <div class="kanban-card-meta">
                  <div class="meta-row">
                    <span class="meta-label">{{ t('demand.current') }}</span>
                    <span class="meta-value">{{ item.current_demand }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">{{ t('demand.forecast') }}</span>
                    <span class="meta-value">{{ item.forecasted_demand }}</span>
                  </div>
                </div>
                <div class="kanban-card-footer">
                  <span class="kanban-period">{{ translatePeriod(item.period) }}</span>
                </div>
              </div>
              <div v-if="kanbanIncreasing.length === 0" class="kanban-empty">{{ t('demand.noItems') }}</div>
            </div>
          </div>

          <!-- Stable column -->
          <div class="kanban-column stable-col">
            <div class="kanban-column-header">
              <span class="column-icon">&#8594;</span>
              <span class="column-title">{{ t('demand.stableDemand') }}</span>
              <span class="column-count">{{ kanbanStable.length }}</span>
            </div>
            <div class="kanban-cards">
              <div v-for="item in kanbanStable" :key="item.id" class="kanban-card">
                <div class="kanban-card-header">
                  <span class="kanban-sku">{{ item.item_sku }}</span>
                  <span class="kanban-change stable">{{ getChangePercent(item) }}%</span>
                </div>
                <div class="kanban-card-name">{{ item.item_name }}</div>
                <div class="kanban-card-meta">
                  <div class="meta-row">
                    <span class="meta-label">{{ t('demand.current') }}</span>
                    <span class="meta-value">{{ item.current_demand }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">{{ t('demand.forecast') }}</span>
                    <span class="meta-value">{{ item.forecasted_demand }}</span>
                  </div>
                </div>
                <div class="kanban-card-footer">
                  <span class="kanban-period">{{ translatePeriod(item.period) }}</span>
                </div>
              </div>
              <div v-if="kanbanStable.length === 0" class="kanban-empty">{{ t('demand.noItems') }}</div>
            </div>
          </div>

          <!-- Decreasing column -->
          <div class="kanban-column decreasing-col">
            <div class="kanban-column-header">
              <span class="column-icon">&#8595;</span>
              <span class="column-title">{{ t('demand.decreasingDemand') }}</span>
              <span class="column-count">{{ kanbanDecreasing.length }}</span>
            </div>
            <div class="kanban-cards">
              <div v-for="item in kanbanDecreasing" :key="item.id" class="kanban-card">
                <div class="kanban-card-header">
                  <span class="kanban-sku">{{ item.item_sku }}</span>
                  <span class="kanban-change decreasing">{{ getChangePercent(item) }}%</span>
                </div>
                <div class="kanban-card-name">{{ item.item_name }}</div>
                <div class="kanban-card-meta">
                  <div class="meta-row">
                    <span class="meta-label">{{ t('demand.current') }}</span>
                    <span class="meta-value">{{ item.current_demand }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">{{ t('demand.forecast') }}</span>
                    <span class="meta-value">{{ item.forecasted_demand }}</span>
                  </div>
                </div>
                <div class="kanban-card-footer">
                  <span class="kanban-period">{{ translatePeriod(item.period) }}</span>
                </div>
              </div>
              <div v-if="kanbanDecreasing.length === 0" class="kanban-empty">{{ t('demand.noItems') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { api } from '../api'
import { useFilters } from '../composables/useFilters'
import { useI18n } from '../composables/useI18n'

export default {
  name: 'Demand',
  setup() {
    const { t, currentLocale } = useI18n()
    const loading = ref(true)
    const error = ref(null)
    const allForecasts = ref([])
    const inventoryItems = ref([])

    // View mode toggle
    const viewMode = ref('table')

    // Page-level multi-select filters (arrays for Vue reactivity)
    const selectedTrends = ref([])
    const selectedPeriods = ref([])

    // Use shared filters
    const { selectedLocation, selectedCategory, getCurrentFilters } = useFilters()

    // Global filter: apply warehouse/category via inventory SKU matching
    const globallyFiltered = computed(() => {
      if (selectedLocation.value === 'all' && selectedCategory.value === 'all') {
        return allForecasts.value
      }
      const validSkus = new Set(inventoryItems.value.map(item => item.sku))
      return allForecasts.value.filter(f => validSkus.has(f.item_sku))
    })

    // Available periods derived from globally filtered data
    const availablePeriods = computed(() => {
      const periods = new Set(globallyFiltered.value.map(f => f.period))
      return Array.from(periods).sort()
    })

    // Local filters chained on top of global filter
    const filteredForecasts = computed(() => {
      let result = globallyFiltered.value

      if (selectedTrends.value.length > 0) {
        result = result.filter(f => selectedTrends.value.includes(f.trend))
      }

      if (selectedPeriods.value.length > 0) {
        result = result.filter(f => selectedPeriods.value.includes(f.period))
      }

      return result
    })

    const hasLocalFilters = computed(() => {
      return selectedTrends.value.length > 0 || selectedPeriods.value.length > 0
    })

    const toggleTrend = (trend) => {
      const idx = selectedTrends.value.indexOf(trend)
      if (idx === -1) {
        selectedTrends.value = [...selectedTrends.value, trend]
      } else {
        selectedTrends.value = selectedTrends.value.filter(t => t !== trend)
      }
    }

    const togglePeriod = (period) => {
      const idx = selectedPeriods.value.indexOf(period)
      if (idx === -1) {
        selectedPeriods.value = [...selectedPeriods.value, period]
      } else {
        selectedPeriods.value = selectedPeriods.value.filter(p => p !== period)
      }
    }

    const clearLocalFilters = () => {
      selectedTrends.value = []
      selectedPeriods.value = []
    }

    // Kanban computed data
    const kanbanIncreasing = computed(() => filteredForecasts.value.filter(f => f.trend === 'increasing'))
    const kanbanStable = computed(() => filteredForecasts.value.filter(f => f.trend === 'stable'))
    const kanbanDecreasing = computed(() => filteredForecasts.value.filter(f => f.trend === 'decreasing'))

    const loadForecasts = async () => {
      try {
        loading.value = true
        const filters = getCurrentFilters()

        const [forecastsData, inventoryData] = await Promise.all([
          api.getDemandForecasts(),
          api.getInventory({
            warehouse: filters.warehouse,
            category: filters.category
          })
        ])

        allForecasts.value = forecastsData
        inventoryItems.value = inventoryData
      } catch (err) {
        error.value = 'Failed to load demand forecasts: ' + err.message
      } finally {
        loading.value = false
      }
    }

    // Watch for global filter changes and reload data
    watch([selectedLocation, selectedCategory], () => {
      loadForecasts()
    })

    // getForecastsByTrend uses filteredForecasts so trend cards reflect local filters too
    const getForecastsByTrend = (trend) => {
      return filteredForecasts.value.filter(f => f.trend === trend)
    }

    const getChangePercent = (forecast) => {
      const change = ((forecast.forecasted_demand - forecast.current_demand) / forecast.current_demand * 100).toFixed(1)
      return change > 0 ? `+${change}` : change
    }

    const getChangeColor = (forecast) => {
      const change = forecast.forecasted_demand - forecast.current_demand
      const changePercent = Math.abs((change / forecast.current_demand) * 100)

      if (changePercent <= 2) {
        return '#3b82f6'
      }

      if (change > 0) return '#10b981'
      if (change < 0) return '#ef4444'
      return '#3b82f6'
    }

    const translatePeriod = (period) => {
      if (currentLocale.value === 'ja') {
        return period
          .replace(/Next\s+/i, '次の')
          .replace(/\s+months/i, 'か月')
          .replace(/\s+month/i, 'か月')
          .replace(/\s+days/i, '日間')
          .replace(/\s+day/i, '日')
          .replace('Q1', '第1四半期')
          .replace('Q2', '第2四半期')
          .replace('Q3', '第3四半期')
          .replace('Q4', '第4四半期')
      }
      return period
    }

    onMounted(loadForecasts)

    return {
      t,
      loading,
      error,
      viewMode,
      selectedTrends,
      selectedPeriods,
      availablePeriods,
      hasLocalFilters,
      filteredForecasts,
      kanbanIncreasing,
      kanbanStable,
      kanbanDecreasing,
      toggleTrend,
      togglePeriod,
      clearLocalFilters,
      getForecastsByTrend,
      getChangePercent,
      getChangeColor,
      translatePeriod
    }
  }
}
</script>

<style scoped>
/* ── Page-level multi-select filters ── */
.demand-filters {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  flex-wrap: wrap;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.filter-tags {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.filter-tag {
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tag:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.filter-tag.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #2563eb;
}

.filter-tag.increasing.active {
  border-color: #10b981;
  background: #d1fae5;
  color: #065f46;
}

.filter-tag.stable.active {
  border-color: #3b82f6;
  background: #dbeafe;
  color: #1e40af;
}

.filter-tag.decreasing.active {
  border-color: #ef4444;
  background: #fee2e2;
  color: #991b1b;
}

.clear-local-filters {
  margin-left: auto;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--border-primary);
  background: var(--bg-card);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.clear-local-filters:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* ── Trend summary cards ── */
.demand-trend-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.trend-card {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.trend-card:hover {
  box-shadow: var(--shadow-md);
}

.increasing-card {
  border-left: 4px solid #10b981;
}

.stable-card {
  border-left: 4px solid #3b82f6;
}

.decreasing-card {
  border-left: 4px solid #ef4444;
}

.trend-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-secondary);
}

.trend-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 1.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.increasing-card .trend-icon {
  background: var(--badge-success-bg);
  color: var(--badge-success-text);
}

.stable-card .trend-icon {
  background: var(--badge-info-bg);
  color: var(--badge-info-text);
}

.decreasing-card .trend-icon {
  background: var(--badge-danger-bg);
  color: var(--badge-danger-text);
}

.trend-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.trend-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 0.25rem;
}

.trend-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.trend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--bg-primary);
  border-radius: 6px;
  transition: background 0.2s;
}

.trend-item:hover {
  background: var(--bg-secondary);
}

.item-name {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 1rem;
}

.item-change {
  font-size: 0.813rem;
  font-weight: 700;
  flex-shrink: 0;
}

.increasing-card .item-change {
  color: #059669;
}

.stable-card .item-change {
  color: #3b82f6;
}

.decreasing-card .item-change {
  color: #dc2626;
}

.item-change.neutral {
  color: var(--text-muted);
}

.more-items {
  font-size: 0.813rem;
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  padding: 0.5rem;
}

/* ── View toggle ── */
.view-toggle {
  display: flex;
  gap: 0.25rem;
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 0.25rem;
}

.view-toggle button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.813rem;
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.view-toggle button:hover {
  color: var(--text-primary);
}

.view-toggle button.active {
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.view-toggle button svg {
  width: 16px;
  height: 16px;
}

/* ── Table empty state ── */
.table-empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-style: italic;
}

/* ── Kanban board ── */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  min-height: 400px;
}

.kanban-column {
  background: var(--bg-primary);
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid var(--border-primary);
}

.kanban-column-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
  border-bottom: 2px solid var(--border-primary);
}

.increasing-col .kanban-column-header { border-bottom-color: #10b981; }
.stable-col .kanban-column-header { border-bottom-color: #3b82f6; }
.decreasing-col .kanban-column-header { border-bottom-color: #ef4444; }

.column-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.increasing-col .column-icon { background: #d1fae5; color: #065f46; }
.stable-col .column-icon { background: #dbeafe; color: #1e40af; }
.decreasing-col .column-icon { background: #fee2e2; color: #991b1b; }

.column-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-primary);
  flex: 1;
}

.column-count {
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
}

.kanban-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.kanban-card {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 0.875rem;
  transition: all 0.2s;
  cursor: default;
}

.kanban-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-hover);
}

.kanban-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.kanban-sku {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  font-family: monospace;
}

.kanban-change {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
}

.kanban-change.increasing { background: #d1fae5; color: #065f46; }
.kanban-change.stable { background: #dbeafe; color: #1e40af; }
.kanban-change.decreasing { background: #fee2e2; color: #991b1b; }

.kanban-card-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.625rem;
}

.kanban-card-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.meta-label {
  font-size: 0.688rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.kanban-card-footer {
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-secondary);
}

.kanban-period {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.kanban-empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-style: italic;
}
</style>
