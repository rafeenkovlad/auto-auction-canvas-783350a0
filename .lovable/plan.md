# Перевод названий элементов на русский

## Что не так сейчас

В боковой панели «Заметки» схемы осмотра, а также в карточках «Технического состояния» и в галерее подписи элементов формируются так:

```ts
ELEMENT_LABEL[el.elementType] ?? el.elementType.replace(/_/g, " ")
```

Если `elementType` отсутствует в словаре `ELEMENT_LABEL` (`src/lib/report.constants.ts`), выводится сырой английский идентификатор с подчёркиваниями, например `engine_bay`, `battery`, `obd_scan`. Именно поэтому рядом с корректным «Общее состояние» встречаются английские названия.

Сейчас в словаре покрыты: кузов, силовые элементы, стёкла, часть салона, колёса, освещение. **Не покрыты**: под капотом, компьютерная диагностика, часть салона (обшивки, ремни, коврики и т.д.), некоторые синонимы из бэкенда.

## Что сделать

1. **Расширить `ELEMENT_LABEL`** в `src/lib/report.constants.ts`, добавив недостающие разделы:
   - **Под капотом**: `engine`, `engine_bay`, `battery`, `radiator`, `coolant_reservoir`, `washer_reservoir`, `brake_fluid_reservoir`, `power_steering_reservoir`, `air_filter_box`, `oil_filler_cap`, `intake_manifold`, `belts`, `wiring`, `fuse_box_under_hood`, `front_panel`/`front_tv`/`front_slam_panel` (телевизор), `left_wheel_arch`, `right_wheel_arch`, `left_apron`, `right_apron`, `left_frame_rail_engine_bay`, `right_frame_rail_engine_bay`, `firewall`.
   - **Компьютерная диагностика**: `obd_scan`, `error_codes`, `engine_diagnostics`, `transmission_diagnostics`, `abs_diagnostics`, `srs_diagnostics`, `body_control_diagnostics`, `climate_diagnostics`, `mileage_verification`.
   - **Салон (дополнить)**: `driver_seat`, `passenger_seat`, `rear_left_seat`, `rear_right_seat`, `seat_belts`, `door_card_front_left`, `door_card_front_right`, `door_card_rear_left`, `door_card_rear_right`, `floor_mats`, `trunk_trim`, `sun_visors`, `rear_view_mirror`, `pedals`, `handbrake`, `glove_box`, `armrest`, `roof_liner`, `a_pillar_trim_left`, `a_pillar_trim_right`, `b_pillar_trim_left`, `b_pillar_trim_right`, `c_pillar_trim_left`, `c_pillar_trim_right`.
   - **Синонимы бэкенда** для уже переведённых элементов (по мере обнаружения при просмотре реальных отчётов).

2. **Единая функция перевода** `translateElementType(type: string): string` в `src/lib/report.constants.ts`:
   - Возвращает значение из `ELEMENT_LABEL`, если найдено.
   - Иначе — форматирует `snake_case` в человекочитаемый вид с первой заглавной буквой, но помечает результат как «неизвестный тип» через возврат исходного значения, чтобы такие случаи было проще замечать в отчётах.

3. **Заменить дублирующийся fallback** во всех местах, где сейчас пишется
   `ELEMENT_LABEL[el.elementType] ?? el.elementType.replace(/_/g, " ")`,
   на вызов `translateElementType(el.elementType)`. Файлы:
   `src/hooks/useReportData.ts`, `src/components/TechnicalCondition.tsx`,
   `src/components/CarBodySchema.tsx`, `src/components/FrameSchema.tsx`,
   `src/components/WheelsSchema.tsx`, `src/components/GlassSchema.tsx`,
   `src/components/LightingSchema.tsx`, `src/components/InteriorSchema.tsx`.

4. **Проверить** превью с текущим токеном отчёта: пройтись по всем вкладкам «Схемы осмотра» и убедиться, что в списке «Заметки» и подписях зон нет английских слов.

## Что не входит

- Перевод названий повреждений (`DamageTag.name`) — они приходят с бэкенда уже локализованными и в вопросе не отмечены.
- Изменение бизнес-логики, API и структуры данных.

## Технические детали

- Правки только в презентационном слое (`src/lib/report.constants.ts` + компоненты схем).
- Стили, разметка, поведение ховеров/кликов не меняются.
- Если пользователь встретит ещё какой-то английский идентификатор, его достаточно будет один раз добавить в `ELEMENT_LABEL`.
