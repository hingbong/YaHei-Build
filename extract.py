import re
import fontforge as ff
from glob import glob

# true 为 UI
# os2_codepages sc (537133471, -1006632960) hc (537919903, -1006632960) 没什么用，给系统识别
fontList = [{True: {"en": "Microsoft YaHei UI", "zh": "微软雅黑 UI"}, False: {"en": "Microsoft YaHei", "zh": "微软雅黑"}}, {True: {"en": "Microsoft JhengHei UI", "zh": "微軟正黑體 UI"}, False: {"en": "Microsoft JhengHei", "zh": "微軟正黑體"}}]
retList = ["msyh", "msjh"]
os2_codepagesList = [(537133471, -1006632960), (537919903, -1006632960)]
# index 0 雅黑 1 正黑
class TTFTask:
  def __init__(self, font, variant, ui, index) -> None:
    self.font = font
    for locale, name, value in font.sfnt_names:
      if name == "Preferred Styles":
        self.variant = value
        break
    self.ui = ui
    self.index = index

  def get_subfamily(self):
    return None

  def edit(self):
    font = fontList[self.index]
    enusr = font[self.ui]["en"]
    zhcnr = font[self.ui]["zh"]
    enus = enusr + " " + self.variant
    zhcn = zhcnr + " " + self.variant
    if self.variant == "Regular":
      enus = enusr
      zhcn = zhcnr
    # self.font.fullname = enus
    self.font.fontname = enus.replace(" ", "")
    self.font.fullname = enus
    self.font.familyname = enusr
    print(self.font.fontname)
    print(self.font.fullname)
    print(self.font.familyname)
    self.font.os2_codepages = os2_codepagesList[self.index]
    self.font.appendSFNTName("English (US)", "Family", enusr)
    self.font.appendSFNTName("English (US)", "UniqueID", enus)
    self.font.appendSFNTName("English (US)", "Fullname", enus)
    self.font.appendSFNTName("English (US)", "Preferred Family", enusr)

    self.font.appendSFNTName("Chinese (PRC)", "Family", zhcnr)
    self.font.appendSFNTName("Chinese (PRC)", "UniqueID", zhcn)
    self.font.appendSFNTName("Chinese (PRC)", "Fullname", zhcn)
    self.font.appendSFNTName("Chinese (PRC)", "Preferred Family", zhcnr)

    self.font.appendSFNTName("Chinese (Singapore)", "Family", zhcnr)
    self.font.appendSFNTName("Chinese (Singapore)", "UniqueID", zhcn)
    self.font.appendSFNTName("Chinese (Singapore)", "Fullname", zhcn)
    self.font.appendSFNTName("Chinese (Singapore)", "Preferred Family", zhcnr)

    self.font.appendSFNTName("Chinese (Taiwan)", "Family", zhcnr)
    self.font.appendSFNTName("Chinese (Taiwan)", "UniqueID", zhcn)
    self.font.appendSFNTName("Chinese (Taiwan)", "Fullname", zhcn)
    self.font.appendSFNTName("Chinese (Taiwan)", "Preferred Family", zhcnr)

    self.font.appendSFNTName("Chinese (Hong Kong)", "Family", zhcnr)
    self.font.appendSFNTName("Chinese (Hong Kong)", "UniqueID", zhcn)
    self.font.appendSFNTName("Chinese (Hong Kong)", "Fullname", zhcn)
    self.font.appendSFNTName("Chinese (Hong Kong)", "Preferred Family", zhcnr)

    self.font.appendSFNTName("Chinese (Macau)", "Family", zhcnr)
    self.font.appendSFNTName("Chinese (Macau)", "UniqueID", zhcn)
    self.font.appendSFNTName("Chinese (Macau)", "Fullname", zhcn)
    self.font.appendSFNTName("Chinese (Macau)", "Preferred Family", zhcnr)
    for (lang, key, field) in self.font.sfnt_names:
      print(lang, '%s=%s'%(key, field))
    # print(self.font.sfnt_names)

class TTCFile:
  def __init__(self, file, variant):
    self.file = file
    self.variant = variant
    self.output = transformVariant

  def openTTF(self, isui, index):
    target = "Sarasa Gothic CL"
    if isui:
      target = "Sarasa UI CL"
    font = ff.open('%s(%s%s)'%(self.file, target, self.variant))
    return TTFTask(font, self.variant, isui, index)

  def build(self):
    ttf = self.openTTF(False, 0)
    ttf.edit()
    ttfui = self.openTTF(True, 0)
    ttfui.edit()
    ttf.font.generateTtc("out/%s"%self.output(self.variant, 0), ttfui.font, ttcflags = ("merge"), layer = 1)
    ttf.font.close()
    ttfui.font.close()
    ttf = self.openTTF(False, 1)
    ttf.edit()
    ttfui = self.openTTF(True, 1)
    ttfui.edit()
    ttf.font.generateTtc("out/%s"%self.output(self.variant, 1), ttfui.font, ttcflags = ("merge"), layer = 1)
    ttf.font.close()
    ttfui.font.close()
  
  def __str__(self) -> str:
    return 'TTCFile(%s, %s) -> %s'%(self.file, self.variant, self.output)

def listTtc(pattern):
  for ttc in glob(pattern):
    for face in ff.fontsInFile(ttc):
      if m := re.match(r"Sarasa Gothic CL(.*)?", face):
        yield TTCFile(ttc, m.group(1))

def transformVariant(input, index):
  ret = retList[index]
  if "Bold" in input:
    ret += "bd"
  if "Semibold" in input:
    ret += "sb"
  if "Light" in input:
    ret += "l"
  if "Xlight" in input:
    ret += "xl"
  if "Italic" in input:
    ret += "i"
  return ret + ".ttc"

for ttc in listTtc("data/*.ttc"):
  print(ttc)
  ttc.build()
