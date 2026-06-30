package vn.greenlab.model.excel.rules;

import org.apache.poi.ss.usermodel.IndexedColors;
import vn.greenlab.model.excel.ExcelBgColorRule;

/** Ví dụ rule: tô nền đỏ nếu cellValue == 2003. */
public class BgRedIfEquals2003Rule implements ExcelBgColorRule {
    @Override
    public boolean matches(Object rowObject, Object cellValue) {
        if (cellValue == null) return false;
        if (cellValue instanceof Number n) {
            return n.intValue() == 2003;
        }
        return "2003".equals(String.valueOf(cellValue).trim());
    }

    @Override
    public IndexedColors bgColor() {
        return IndexedColors.RED;
    }
}

