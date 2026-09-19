package com.cato.nativeandroid

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.LayerDrawable
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.RectShape
import android.view.Gravity
import android.widget.TextView

data class CatoAndroidColors(
    val background: Int = Color.rgb(249, 245, 255),
    val surface: Int = Color.WHITE,
    val navSurface: Int = Color.rgb(249, 245, 255),
    val navBorder: Int = Color.rgb(167, 123, 232),
    val border: Int = Color.rgb(214, 186, 255),
    val accent: Int = Color.rgb(30, 31, 130),
    val onAccent: Int = Color.WHITE,
    val textPrimary: Int = Color.rgb(35, 25, 79),
    val textSecondary: Int = Color.rgb(30, 31, 130),
    val navText: Int = Color.rgb(30, 31, 130),
    val success: Int = Color.rgb(79, 125, 90),
    val warning: Int = Color.rgb(176, 114, 35),
    val error: Int = Color.rgb(156, 34, 19),
)

class CatoAndroidText {
    fun label(
        context: Context,
        value: String,
        size: Int,
        color: Int,
        bold: Boolean = false,
    ): TextView {
        return TextView(context).apply {
            text = value
            textSize = size.toFloat()
            setTextColor(color)
            gravity = Gravity.START
            includeFontPadding = true
            if (bold) {
                typeface = Typeface.DEFAULT_BOLD
            }
        }
    }
}

object CatoAndroidDrawable {
    fun rounded(fill: Int, radius: Int, stroke: Int): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(fill)
            cornerRadius = radius.toFloat()
            setStroke(1, stroke)
        }
    }

    fun spacer(size: Int, vertical: Boolean): LayerDrawable {
        val shape = ShapeDrawable(RectShape()).apply {
            intrinsicHeight = if (vertical) size else 1
            intrinsicWidth = if (vertical) 1 else size
            paint.color = Color.TRANSPARENT
        }
        return LayerDrawable(arrayOf(ColorDrawable(Color.TRANSPARENT), shape))
    }
}
