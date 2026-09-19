package com.cato.nativeandroid

import android.content.Context
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.Movie
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material.icons.outlined.Movie
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.zIndex
import com.cato.app.ui.BottomNavigationSpec
import com.cato.app.ui.NavItemSpec
import com.example.bottombar.AnimatedBottomBar
import com.example.bottombar.model.IndicatorStyle

class CatoAndroidShell(
    private val context: Context,
    private val colors: CatoAndroidColors,
    @Suppress("unused") private val text: CatoAndroidText,
) {
    fun screen(
        bottomNavigation: BottomNavigationSpec,
        content: View,
        onNavItemSelected: (String) -> Unit,
        showBottomNavigation: Boolean = true,
    ): View {
        return ComposeView(context).apply {
            setContent {
                CatoMaterialTheme(colors) {
                    ShellScaffold(
                        bottomNavigation = bottomNavigation,
                        content = content,
                        onNavItemSelected = onNavItemSelected,
                        showBottomNavigation = showBottomNavigation,
                    )
                }
            }
        }
    }

    @Composable
    private fun ShellScaffold(
        bottomNavigation: BottomNavigationSpec,
        content: View,
        onNavItemSelected: (String) -> Unit,
        showBottomNavigation: Boolean,
    ) {
        val imeVisible = WindowInsets.ime.getBottom(LocalDensity.current) > 0
        Scaffold(
            containerColor = Color(colors.background),
            bottomBar = {
                if (showBottomNavigation && !imeVisible) {
                    CatoBottomNavigation(
                        spec = bottomNavigation,
                        onNavItemSelected = onNavItemSelected,
                    )
                }
            },
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = innerPadding.calculateBottomPadding()),
            ) {
                AndroidView(
                    modifier = Modifier.fillMaxSize(),
                    factory = {
                        (content.parent as? ViewGroup)?.removeView(content)
                        content
                    },
                )
            }
        }
    }

    @Composable
    private fun CatoBottomNavigation(
        spec: BottomNavigationSpec,
        onNavItemSelected: (String) -> Unit,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 28.dp, end = 28.dp, bottom = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            CatoNavigationPill(
                items = spec.leftItems,
                unreadBadge = spec.unreadMessageBadge,
                onNavItemSelected = onNavItemSelected,
                modifier = Modifier.weight(1f),
            )
            Spacer(modifier = Modifier.width(12.dp))
            CatoCenterReelsButton(
                item = spec.centerItem,
                onNavItemSelected = onNavItemSelected,
            )
            Spacer(modifier = Modifier.width(12.dp))
            CatoNavigationPill(
                items = spec.rightItems,
                unreadBadge = spec.unreadMessageBadge,
                onNavItemSelected = onNavItemSelected,
                modifier = Modifier.weight(1f),
            )
        }
    }

    @Composable
    private fun CatoNavigationPill(
        items: List<NavItemSpec>,
        unreadBadge: String?,
        onNavItemSelected: (String) -> Unit,
        modifier: Modifier = Modifier,
    ) {
        val selectedIndex = items.indexOfFirst { it.selected }.takeIf { it >= 0 }
        AnimatedBottomBar(
            modifier = modifier,
            containerColor = Color(colors.navSurface),
            contentColor = Color(colors.navText),
            containerShape = RoundedCornerShape(34.dp),
            selectedItem = selectedIndex,
            itemSize = items.size,
            indicatorStyle = IndicatorStyle.FILLED,
            indicatorColor = Color(colors.border).copy(alpha = 0.58f),
            bottomBarHeight = 68.dp,
        ) {
            items.forEach { item ->
                CatoAnimatedNavigationItem(
                    item = item,
                    selected = item.selected,
                    unreadBadge = unreadBadge,
                    onNavItemSelected = onNavItemSelected,
                )
            }
        }
    }

    @Composable
    private fun CatoCenterReelsButton(
        item: NavItemSpec,
        onNavItemSelected: (String) -> Unit,
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(68.dp)
                .clickable { onNavItemSelected(item.key) },
        ) {
            Surface(
                color = if (item.selected) Color(colors.accent) else Color(colors.surface),
                contentColor = if (item.selected) Color(colors.onAccent) else Color(colors.accent),
                shape = CircleShape,
                tonalElevation = 3.dp,
                shadowElevation = 6.dp,
                modifier = Modifier.size(58.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = iconFor(item.iconName),
                        contentDescription = item.label,
                        tint = if (item.selected) Color(colors.onAccent) else Color(colors.accent),
                        modifier = Modifier.size(30.dp),
                    )
                }
            }
        }
    }

    @Composable
    private fun RowScope.CatoAnimatedNavigationItem(
        item: NavItemSpec,
        selected: Boolean,
        unreadBadge: String?,
        onNavItemSelected: (String) -> Unit,
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .weight(1f)
                .fillMaxSize()
                .clickable { onNavItemSelected(item.key) },
        ) {
            Icon(
                imageVector = iconFor(item.iconName, filled = selected),
                contentDescription = item.label,
                tint = if (selected) Color(colors.accent) else Color(colors.navText),
                modifier = Modifier.size(28.dp),
            )
            CatoNavigationBadge(
                item = item,
                unreadBadge = unreadBadge,
            )
        }
    }

    @Composable
    private fun BoxScope.CatoNavigationBadge(
        item: NavItemSpec,
        unreadBadge: String?,
    ) {
        when {
            item.showsWarningBadge -> {
                Surface(
                    color = Color.Transparent,
                    shape = CircleShape,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = 4.dp, y = 10.dp)
                        .zIndex(10f),
                ) {
                    Icon(
                        imageVector = Icons.Filled.Warning,
                        contentDescription = "Needs setup",
                        tint = Color(colors.warning),
                        modifier = Modifier.size(17.dp),
                    )
                }
            }
            (item.key == "messages" || item.key == "requests") && unreadBadge != null -> {
                Badge(
                    containerColor = Color(colors.accent),
                    contentColor = Color(colors.onAccent),
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = (-16).dp, y = 8.dp),
                ) {
                    Text(unreadBadge)
                }
            }
        }
    }

    private fun iconFor(name: String, filled: Boolean = true): ImageVector {
        return when {
            name.contains("house") -> if (filled) Icons.Filled.Home else Icons.Outlined.Home
            name.contains("magnifying") -> if (filled) Icons.Filled.Search else Icons.Outlined.Search
            name.contains("film") -> if (filled) Icons.Filled.Movie else Icons.Outlined.Movie
            name.contains("message") -> if (filled) Icons.Filled.ChatBubble else Icons.Outlined.ChatBubbleOutline
            name.contains("gear") -> if (filled) Icons.Filled.Settings else Icons.Outlined.Settings
            name.contains("envelope") -> if (filled) Icons.Filled.Mail else Icons.Outlined.MailOutline
            name.contains("person") -> if (filled) Icons.Filled.Person else Icons.Outlined.PersonOutline
            else -> Icons.Filled.Home
        }
    }
}

@Composable
private fun CatoMaterialTheme(
    colors: CatoAndroidColors,
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = Color(colors.accent),
            onPrimary = Color(colors.onAccent),
            background = Color(colors.background),
            onBackground = Color(colors.textPrimary),
            surface = Color(colors.surface),
            onSurface = Color(colors.textPrimary),
            secondary = Color(colors.textSecondary),
            onSecondary = Color(colors.surface),
        ),
        content = content,
    )
}
