# Lovelace custom card for Octopus Energy Rate chart

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)

This lovelace card displays a chart (bar graph) of the Octopus Energy rate prices per each 30 minute slot, pulling the data from sensors of the the excellent [BottlecapDave/HomeAssistant-OctopusEnergy](https://github.com/BottlecapDave/) integration.

The look and feel is unashamedly inspired by the excellent iOS app [Octopus Compare](https://apps.apple.com/gb/app/octopus-compare/id1545004095)

If you'd prefer a table user interface, consider using the superb [lozzd/octopus-energy-rates-card](https://github.com/lozzd/octopus-energy-rates-card).

#### Installation
##### HACS
The easiest way to install it is via [HACS (Home Assistant Community Store)](https://github.com/hacs/frontend). This will ensure you get updates automatically too. 

Simply click this button to go directly to the details page:

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=slippyr4&repository=lovelace-octopusenergy-chart&category=plugin)

In the Home Assistant UI:
* Use HACS -> Top Right Menu -> Custom repositories
* Enter a repo of `slippyr4/lovelace-octopusenwrgy-chart` and category of "Dashboard", and click the Add button
* On the main HACS windows search for Octopus Energy Chart and download it

This should automatically configure all the resources, so you can now skip to **Configuration**.

##### Manually
You can also install manually by downloading/copying the Javascript file in to `$homeassistant_config_dir/www/community/` and then add the Javascript file to Lovelace in the Home Assistant UI by using
Settings -> Dashboards -> Top Right Menu -> Resources

#### Configuration
Add the card to your dashboard using **Add Card -> Custom: Octopus Energy Chart**.

Graphical configuration is supported. You need to pick, as a minimum, the Today's rates entity, but you probably want to pick the Next Day rates one too. Name is optional and if set will show a caption above the graph.

As of version 9.0.0 of the Octopus Energy integration, these entities are now called `events` and not enabled by default. In the Octopus Integration settings, filter by disabled entities and then search for the last section (e.g. `current_day_rates`) then press the button to enable the entity. It may take up to an hour for the data to be present, so don't panic if the card doesn't work immediately.

(The format is, for example: `event.octopus_energy_electricity_{METER_SERIAL_NUMBER}}_{{MPAN_NUMBER}}_current_day_rates`)
