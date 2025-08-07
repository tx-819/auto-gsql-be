import { DbTable } from '../entities';
import { DbColumn } from '../entities';

export type TableDataVo = DbTable & {
  columns: DbColumn[];
};
