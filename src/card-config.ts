import { ActionConfig, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';


// TODO Add your configuration elements here for type-checking
export interface OctopusEnergyChartCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  current_rates_entity?: string;
  next_rates_entity?: string;

}