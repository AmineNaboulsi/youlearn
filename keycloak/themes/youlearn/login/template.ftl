<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<#-- `locale` is only bound when the realm has internationalisation enabled. -->
<#assign langTag = locale?? ?then(locale.currentLanguageTag, "en")>
<html lang="${langTag}" class="${properties.kcHtmlClass!}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <meta name="color-scheme" content="light">
    <meta name="theme-color" content="#ffffff">
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.png" type="image/png"/>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet"/>
        </#list>
    </#if>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript" defer></script>
        </#list>
    </#if>
</head>

<body class="${properties.kcBodyClass!} ${bodyClass}">
<div class="yl-shell">

    <!-- Left rail: brand. Purely decorative, hidden on small screens. -->
    <aside class="yl-brand" aria-hidden="true">
        <div class="yl-brand__inner">
            <div class="yl-brand__mark">
                <img class="yl-brand__glyph" src="${url.resourcesPath}/img/logo-mark.png" alt=""/>
                <span class="yl-brand__word">YouLearn</span>
            </div>
            <p class="yl-brand__tagline">All the skills you need,<br/>in one place.</p>
            <div class="yl-brand__rule"></div>
            <ul class="yl-brand__list">
                <li>Courses authored by practitioners</li>
                <li>Learn at your own pace</li>
                <li>One account, every device</li>
            </ul>
        </div>
        <div class="yl-brand__grid"></div>
    </aside>

    <!-- Right rail: the actual authentication surface. -->
    <main class="${properties.kcLoginClass!}">
        <div class="${properties.kcContentWrapperClass!}">

            <a class="yl-mobile-brand" href="${properties.appUrl!'/'}">
                <img class="yl-brand__glyph" src="${url.resourcesPath}/img/logo-mark.png" alt=""/> YouLearn
            </a>

            <div class="${properties.kcFormCardClass!}">

                <header class="${properties.kcFormHeaderClass!}">
                    <#if realm.internationalizationEnabled && locale?? && locale.supported?size gt 1>
                        <div class="${properties.kcLocaleWrapperClass!}">
                            <label class="${properties.kcSrOnlyClass!}" for="login-select-locale">${msg("languages")}</label>
                            <select id="login-select-locale" class="${properties.kcLocaleDropDownClass!}"
                                    onchange="window.location.href=this.value">
                                <#list locale.supported as l>
                                    <option value="${l.url}" <#if l.languageTag == locale.currentLanguageTag>selected</#if>>${l.label}</option>
                                </#list>
                            </select>
                        </div>
                    </#if>

                    <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
                        <#if displayRequiredFields>
                            <div class="yl-required-note"><span class="yl-required">*</span> ${msg("requiredFields")}</div>
                        </#if>
                        <h1 id="kc-page-title"><#nested "header"></h1>
                    <#else>
                        <#if displayRequiredFields>
                            <div class="yl-required-note"><span class="yl-required">*</span> ${msg("requiredFields")}</div>
                        </#if>
                        <h1 id="kc-page-title"><#nested "header"></h1>
                        <div id="kc-username" class="yl-known-user">
                            <span id="kc-attempted-username">${auth.attemptedUsername}</span>
                            <a id="reset-login" href="${url.loginRestartFlowUrl}" aria-label="${msg("restartLoginTooltip")}">
                                ${msg("restartLoginTooltip")}
                            </a>
                        </div>
                    </#if>
                </header>

                <div id="kc-content">
                    <div id="kc-content-wrapper">

                        <#-- Keycloak surfaces one message at a time. Suppress the
                             duplicate warning the OTP form already renders inline. -->
                        <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                            <div class="${properties.kcAlertClass!} yl-alert--${message.type}" role="alert">
                                <span class="yl-alert__dot" aria-hidden="true"></span>
                                <span class="${properties.kcAlertTitleClass!}">${kcSanitize(message.summary)?no_esc}</span>
                            </div>
                        </#if>

                        <#nested "form">

                        <#if auth?has_content && auth.showTryAnotherWayLink()>
                            <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post">
                                <input type="hidden" name="tryAnotherWay" value="on"/>
                                <button type="submit" class="yl-linkbtn" id="try-another-way">${msg("doTryAnotherWay")}</button>
                            </form>
                        </#if>

                        <#nested "socialProviders">

                        <#if displayInfo>
                            <div id="kc-info" class="${properties.kcSignUpClass!}">
                                <div id="kc-info-wrapper"><#nested "info"></div>
                            </div>
                        </#if>
                    </div>
                </div>
            </div>

            <p class="yl-legal">
                Protected by Keycloak. By continuing you agree to the YouLearn terms of use.
            </p>
        </div>
    </main>
</div>
</body>
</html>
</#macro>
