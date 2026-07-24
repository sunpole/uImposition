# План тестирования / Test Plan

<table>
<tr>
<td width="50%" valign="top">

<h2>Русская версия</h2>

<h3>Уровни</h3>
<ol>
<li>модульные тесты;</li>
<li>интеграционные тесты расчёта;</li>
<li>визуальные проверки схем;</li>
<li>ручная производственная проверка;</li>
<li>PDF-проверка.</li>
</ol>

<h3>Обязательные сценарии</h3>
<ul>
<li>620 × 450 с зачисткой 2 мм превращается в 616 × 446;</li>
<li>пресет 616 × 446 со стадией <code>afterTrim</code> не уменьшается повторно;</li>
<li>поддерживаются разные значения зачистки по сторонам и отключённая зачистка;</li>
<li>отрицательная рабочая область блокируется;</li>
<li>2, 3, 4 и 5 страниц образуют правильные пары;</li>
<li>знак <code>-</code> появляется только на обороте;</li>
<li>зеркало разворачивает столбцы, но не строки;</li>
<li><code>→</code> на лице превращается в <code>←</code> на обороте;</li>
<li>кандидат с недопечаткой отклоняется;</li>
<li>перетираж считается по каждой паре;</li>
<li>изменение приоритетов меняет рекомендуемый вариант;</li>
<li>PDF содержит ровно одну схему на странице;</li>
<li>русский и английский интерфейс показывают одинаковые числа.</li>
</ul>

</td>
<td width="50%" valign="top">

<h2>English version</h2>

<h3>Test levels</h3>
<ol>
<li>unit tests;</li>
<li>calculation integration tests;</li>
<li>visual scheme checks;</li>
<li>manual production review;</li>
<li>PDF verification.</li>
</ol>

<h3>Required scenarios</h3>
<ul>
<li>a 620 × 450 source sheet with 2 mm removed from every edge becomes 616 × 446;</li>
<li>an <code>afterTrim</code> 616 × 446 preset is not trimmed twice;</li>
<li>independent edge values and disabled trimming are supported;</li>
<li>negative usable area is rejected;</li>
<li>2-, 3-, 4- and 5-page files produce correct print pairs;</li>
<li><code>-</code> appears only on back schemes;</li>
<li>horizontal mirroring reverses columns but preserves rows;</li>
<li><code>→</code> becomes <code>←</code> on the back;</li>
<li>underproducing candidates are rejected;</li>
<li>overrun is calculated per print pair;</li>
<li>reordering priorities changes the recommendation;</li>
<li>each PDF page contains exactly one scheme;</li>
<li>Russian and English views preserve identical numbers.</li>
</ul>

</td>
</tr>
</table>

## Контрольный набор / Control dataset

`data/control-case.json`

- 20 файлов / files;
- 35 печатных пар / print pairs;
- 4 монтажа / impositions;
- 8 форм / plates/forms;
- 3395 физических листов / physical sheets;
- 6790 листопрогонов / press passes;
- недопечатка / underproduction: 0;
- ручной перетираж / manual-reference overrun: 1450.

Программный результат может быть лучше ручного ориентира, но не может нарушать жёсткие ограничения.

The optimizer may improve the manual reference, but it must never violate a hard constraint.
