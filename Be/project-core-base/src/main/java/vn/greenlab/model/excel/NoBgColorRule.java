package vn.greenlab.model.excel;

import org.apache.poi.ss.usermodel.IndexedColors;

/** Default rule: không tô màu. */
public class NoBgColorRule implements ExcelBgColorRule {
    @Override
    public boolean matches(Object rowObject, Object cellValue) {
        return false;
    }

    @Override
    public IndexedColors bgColor() {
        return null;
    }
}

