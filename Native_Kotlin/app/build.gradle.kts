import java.util.Properties

plugins {
    id("com.android.application")
    kotlin("android")
    id("org.jetbrains.kotlin.plugin.compose")
}

val localProperties = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) {
        file.inputStream().use { input -> load(input) }
    }
}

val publicBuildDefaults = mapOf(
    "CATO_SUPABASE_URL" to "https://plsmirtnuhrojwztonkt.supabase.co",
    "CATO_SUPABASE_ANON_KEY" to "sb_publishable_cXUqQwc81ueHgGs4uhASJQ__ezqXU_Q",
    "CATO_API_BASE_URL" to "https://cato-api.up.railway.app",
    "CATO_GOOGLE_WEB_CLIENT_ID" to "512338045024-5t2gqbag5romr1j30kac4kejnl72h2dl.apps.googleusercontent.com",
)

fun localProperty(name: String): String {
    return localProperties.getProperty(name)
        ?: providers.gradleProperty(name).orNull
        ?: publicBuildDefaults[name]
        ?: ""
}

fun buildConfigString(value: String): String {
    return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\""
}

android {
    namespace = "com.cato.nativeandroid"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.cato.poc"
        minSdk = 24
        targetSdk = 36
        versionCode = 5
        versionName = "0.1.1"

        buildConfigField("String", "CATO_SUPABASE_URL", buildConfigString(localProperty("CATO_SUPABASE_URL")))
        buildConfigField("String", "CATO_SUPABASE_ANON_KEY", buildConfigString(localProperty("CATO_SUPABASE_ANON_KEY")))
        buildConfigField("String", "CATO_API_BASE_URL", buildConfigString(localProperty("CATO_API_BASE_URL")))
        buildConfigField("String", "CATO_GOOGLE_WEB_CLIENT_ID", buildConfigString(localProperty("CATO_GOOGLE_WEB_CLIENT_ID")))
    }

    buildFeatures {
        buildConfig = true
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    sourceSets {
        getByName("main") {
            kotlin.srcDir("../src/main/kotlin")
        }
    }
}

dependencies {
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("com.canopas.compose-animated-navigationbar:bottombar:1.0.2")
    implementation("io.github.dinuscxj:circleprogressbar:1.4.1")
    implementation("io.coil-kt:coil-compose:2.7.0")
    implementation("com.google.android.gms:play-services-auth:21.2.0")
    implementation(platform("androidx.compose:compose-bom:2024.10.00"))
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.ui:ui-viewbinding")
}

kotlin {
    jvmToolchain(17)
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}
