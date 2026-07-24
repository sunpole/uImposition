# GitHub Pages

<table>
<tr>
<td width="50%" valign="top">

<h2>Русский</h2>

<p>Целевой адрес:</p>

<p><code>https://sunpole.github.io/uImposition/</code></p>

<p>Для проекта используется публикация непосредственно из ветки <code>main</code>, папка <code>/(root)</code>.</p>

<ol>
<li>Открыть <strong>Settings → Pages</strong>.</li>
<li>В разделе <strong>Build and deployment</strong> выбрать <strong>Deploy from a branch</strong>.</li>
<li>Выбрать ветку <code>main</code>.</li>
<li>Выбрать папку <code>/(root)</code>.</li>
<li>Нажать <strong>Save</strong>.</li>
<li>Подождать публикацию и открыть целевой адрес.</li>
</ol>

<p>Файл <code>index.html</code> находится в корне репозитория. Файл <code>.nojekyll</code> запрещает ненужную обработку Jekyll.</p>

<p>Отдельный workflow GitHub Actions сейчас не нужен: источник Pages уже настроен на ветку <code>main</code>.</p>

</td>
<td width="50%" valign="top">

<h2>English</h2>

<p>Target URL:</p>

<p><code>https://sunpole.github.io/uImposition/</code></p>

<p>The project is published directly from the <code>main</code> branch and the <code>/(root)</code> folder.</p>

<ol>
<li>Open <strong>Settings → Pages</strong>.</li>
<li>Select <strong>Deploy from a branch</strong> under <strong>Build and deployment</strong>.</li>
<li>Select the <code>main</code> branch.</li>
<li>Select the <code>/(root)</code> folder.</li>
<li>Click <strong>Save</strong>.</li>
<li>Wait for deployment and open the target URL.</li>
</ol>

<p><code>index.html</code> is stored in the repository root. <code>.nojekyll</code> prevents unnecessary Jekyll processing.</p>

<p>A separate GitHub Actions deployment workflow is not currently required because Pages already uses the <code>main</code> branch as its source.</p>

</td>
</tr>
</table>
