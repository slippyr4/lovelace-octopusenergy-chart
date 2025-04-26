import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Ref, ref, createRef } from 'lit/directives/ref.js';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'
import Chart from "chart.js/auto";
import { DateTime } from 'luxon';
import { OctopusEnergyChartCardConfig } from "./card-config"

interface rateAttribute {
  value_inc_vat: number;
  start: string;
  end: string;
}

// Add card to the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'octopusenergy-chart',
  name: 'Octopus Energy Chart',
  description: 'Chart card for displaying octopus energy rates ',
});

@customElement('octopusenergy-chart')
export class OctopusEnergyChart extends LitElement {

  static styles = css`
    :host {
      display: block;
      font-family: sans-serif;
      padding: 1em;
      background: var(--card-background-color, white);
      border-radius: 8px;
      padding:0;
      height: 100%;
    }

    ha-card {
      height: 100%;
      padding: 16px;
      display: flex;
      flex-direction: column;
    }

    ha-card.with-header {
      padding-top: 0;
    }

    .chart-wrapper {
      flex: 1;
      position: relative;
      width: 100%;
      height: 100%;
    // margin: 16px;
    }

    canvas {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }
  `;

  getCardSize() {
    return 3;
  }

  getGridOptions() {

    return {
      columns: 12,
      min_rows: 1,
      rows: 4,
      max_rows: 6
    };
  }


  static getConfigForm() {

    // Define the form schema.
    const SCHEMA = [
      { name: "name", selector: { text: { type: "string" } } },
      { name: "current_rates_entity", required: true, selector: { entity: { domain: "event"} } },
      { name: "next_rates_entity", required: false, selector: { entity: { domain: "event"} } },
    ];

    // computeLabel returns a localized label for a schema item.
    const computeLabel = (schema: any, localize: any) => {
      return localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
    };

    return {
      schema: SCHEMA,
      computeLabel: computeLabel,
    };
  }

  @property({ attribute: false }) public hass!: HomeAssistant;
  private _canvasRef: Ref<HTMLCanvasElement> = createRef();
  private chart: Chart | null = null;
  @state() private config!: OctopusEnergyChartCardConfig;

  setConfig(config: OctopusEnergyChartCardConfig) {
    if (!config.current_rates_entity) throw new Error("Current rates entity required");
    this.config = {
      name: "",
      ...config
    }
  }


  firstUpdated() {

    const canvas = this._canvasRef.value;
    if (!canvas) return;

    this.chart = new Chart(canvas, {
      type: "bar",
      data: {
        datasets: [{
          data: [],
          backgroundColor: function (context) {
            const label = context.chart.data.labels?.[context.dataIndex] as string;
            const time = DateTime.fromISO(label);

            const past = time < DateTime.now().minus({ minutes: 30 });
            if (past) return 'lightgray';

            const value = context.raw as number;
            if (value < 0) return 'blue';
            if (value < 10) return 'green';
            if (value < 20) return 'gold';
            if (value < 30) return 'orange';
            return 'red';
          },
        }],
        labels: [],
      },
      options: {
        layout: {
          padding: 0
        },
        animation: {
          duration: 0
        },
        transitions: {
          active: {
            animation: {
              duration: 100
            }
          }
        },
        normalized: true,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
          },
          x: {
            ticks: {
              maxTicksLimit: 4,
              callback: function (v, i, t) {
                const label = this.getLabelForValue(<number>v);
                const time = DateTime.fromISO(label);
                return time.toFormat("HH:mm");
              },
              minRotation: 0,
              maxRotation: 0,
            }
          }
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y.toFixed(2);
                return `${value} p/kWh`;  
              },
              title: function(context) {
                const start = DateTime.fromISO(context[0].label);
                const end = start.plus({ minutes: 30});
                const tomorrow = DateTime.now().plus({ days: 1 });
                const isTomorrow = start.hasSame(tomorrow, 'day');

                return isTomorrow ? `Tomorrow ${start.toFormat("HH:mm")} - ${end.toFormat("HH:mm")}` : `${start.toFormat("HH:mm")} - ${end.toFormat("HH:mm")}`;
              }
            }
          }

        }
      },
    });

  }

  updated(changedProps: PropertyValues) {

    if (this.config && this.chart) {
      const current_rates_entityId = this.config?.current_rates_entity;
      const next_rates_entityId = this.config?.next_rates_entity;

      let values: number[] = [];
      let labels: string[] = [];

      if (current_rates_entityId) {
        const ratesToday = this.hass.states[current_rates_entityId];
        values = values.concat(...ratesToday.attributes.rates.map((rate: rateAttribute) => rate.value_inc_vat * 100));
        labels = labels.concat(...ratesToday.attributes.rates.map((rate: any) => rate.start));

        if (next_rates_entityId) {
          const ratesTomorrow = this.hass.states[next_rates_entityId];
          values = values.concat(...ratesTomorrow.attributes.rates.map((rate: rateAttribute) => rate.value_inc_vat * 100));
          labels = labels.concat(...ratesTomorrow.attributes.rates.map((rate: any) => rate.start));

        }
      }

      this.chart.data.datasets[0].data = values;
      this.chart.data.labels = labels;
      this.chart.update('none');
    }

  }


  shouldUpdate(changedProps: PropertyValues): boolean {

    if (this.config && changedProps.has('hass')) {
      const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
      const current_rates_entityId = this.config?.current_rates_entity;
      const next_rates_entityId = this.config?.next_rates_entity;
      if (!oldHass
        || current_rates_entityId && oldHass?.states[current_rates_entityId]?.state !== this.hass.states[current_rates_entityId]?.state
        || next_rates_entityId && oldHass?.states[next_rates_entityId]?.state !== this.hass.states[next_rates_entityId]?.state
      ) {
        return true;
      }
      return false;
    }

    return true; 
  }


  render() {
    if (this.config.name) {
      return html`
      <ha-card .header=${this.config.name} class="with-header">
        <div class="chart-wrapper">
          <canvas ${ref(this._canvasRef)}></canvas>
        </div>
      </ha-card>
    `;
    }
    else {

      return html`
      <ha-card>
        <div class="chart-wrapper">
          <canvas ${ref(this._canvasRef)}></canvas>
        </div>
      </ha-card>
    `;
    }
   
  }

}