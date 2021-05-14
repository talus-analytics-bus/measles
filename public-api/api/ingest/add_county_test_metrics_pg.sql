-- select metric_id
-- from metric
-- where metric_name = 'test_metric_county';
update observation
set datetime_id = 15084
where datetime_id = 15085
    and metric_id = -9998;
select *
from datetime
where dt = '2021-04-18 19:00:00 -05';