import * as migration_20261025_170922_initial from './20261025_170922_initial';
import * as migration_20261026_014046_slice4_content_controls from './20261026_014046_slice4_content_controls';
import * as migration_20261026_014139_slice4_reading_time from './20261026_014139_slice4_reading_time';
import * as migration_20261026_020209_slice4_media_source_ids from './20261026_020209_slice4_media_source_ids';
import * as migration_20261026_033350_slice5_seo_publishing from './20261026_033350_slice5_seo_publishing';
import * as migration_20261026_063635_slice6_contact_delivery from './20261026_063635_slice6_contact_delivery';

export const migrations = [
  {
    up: migration_20261025_170922_initial.up,
    down: migration_20261025_170922_initial.down,
    name: '20261025_170922_initial',
  },
  {
    up: migration_20261026_014046_slice4_content_controls.up,
    down: migration_20261026_014046_slice4_content_controls.down,
    name: '20261026_014046_slice4_content_controls',
  },
  {
    up: migration_20261026_014139_slice4_reading_time.up,
    down: migration_20261026_014139_slice4_reading_time.down,
    name: '20261026_014139_slice4_reading_time',
  },
  {
    up: migration_20261026_020209_slice4_media_source_ids.up,
    down: migration_20261026_020209_slice4_media_source_ids.down,
    name: '20261026_020209_slice4_media_source_ids',
  },
  {
    up: migration_20261026_033350_slice5_seo_publishing.up,
    down: migration_20261026_033350_slice5_seo_publishing.down,
    name: '20261026_033350_slice5_seo_publishing',
  },
  {
    up: migration_20261026_063635_slice6_contact_delivery.up,
    down: migration_20261026_063635_slice6_contact_delivery.down,
    name: '20261026_063635_slice6_contact_delivery'
  },
];
