---
name: ระบบจัดการงานบริการและบันทึกเวลาปฏิบัติงาน IT Support
description: ระบบออกแบบส่วนติดต่อผู้ใช้ภาษาไทยระดับองค์กรด้วยฟอนต์ IBM Plex Sans Thai สำหรับศูนย์บริการเทคนิค IT Support
colors:
  primary-cobalt: "#2563eb"
  primary-cobalt-deep: "#1d4ed8"
  surface-paper: "#ffffff"
  canvas-alabaster: "#f8fafc"
  surface-slate-muted: "#f1f5f9"
  night-canvas: "#020617"
  night-surface: "#0f172a"
  night-elevated: "#1e293b"
  ink-primary: "#0f172a"
  ink-secondary: "#475569"
  border-hairline: "#e2e8f0"
  status-emerald: "#059669"
  status-amber: "#d97706"
  status-crimson: "#dc2626"
typography:
  display:
    fontFamily: "IBM Plex Sans Thai, Noto Sans Thai, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "IBM Plex Sans Thai, Noto Sans Thai, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.42
    letterSpacing: "-0.005em"
  title:
    fontFamily: "IBM Plex Sans Thai, Noto Sans Thai, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "IBM Plex Sans Thai, Noto Sans Thai, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "IBM Plex Sans Thai, Noto Sans Thai, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.005em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary-cobalt}"
    textColor: "{colors.surface-paper}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-cobalt-deep}"
  card-surface:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: ระบบจัดการงานบริการและบันทึกเวลาปฏิบัติงาน IT Support

## Overview

**Creative North Star: "The Precision Service Ledger (สมุดทะเบียนงานบริการเทคนิคที่แม่นยำและชัดเจน)"**

ระบบการออกแบบนี้นำแรงบันดาลใจจากสมุดทะเบียนรับแจ้งซ่อมและใบลงเวลาปฏิบัติงานแบบกระดาษมาตรฐานในห้องปฏิบัติการวิศวกรรม มาหลอมรวมเข้ากับความคมชัดของแดชบอร์ดปฏิบัติการยุคใหม่ (Operate Mode) ทุกองค์ประกอบถูกจัดวางเพื่อลดภาระทางสายตาของช่างเทคนิคและผู้รับบริการ ไม่มีลวดลายกราฟิกฟุ่มเฟือยหรือการไล่เฉดสีที่รบกวนการอ่าน

ความงามของระบบเกิดจากระเบียบของตาราง ความชัดเจนของลำดับขั้นข้อความภาษาไทยด้วยฟอนต์ **IBM Plex Sans Thai** และพื้นที่ลงลายมือชื่อดิจิทัลที่ให้ความรู้สึกมั่นคงเสมือนจรดปากกาลงบนเอกสารจริง

**Key Characteristics:**
- ใช้ฟอนต์ **IBM Plex Sans Thai** (น้ำหนัก 400, 500, 600, 700) เพียงตระกูลเดียวทั้งระบบ พร้อมเปิดใช้งานตัวเลขแนวตรง (`tabular-nums`) สำหรับรหัสใบรับบริการ วันที่ และเวลา
- พื้นผิวแบบเรียบคมชัด (Flat-By-Default) แยกสัดส่วนด้วยเส้นขอบ `1px` และระยะห่างที่สมดุล โดยไม่ซ้อนการ์ดไว้ในการ์ด (No Nested Cards)
- รองรับโหมดสว่าง (Light Mode) สำหรับสภาพแวดล้อมสำนักงาน และโหมดมืด (Dark Mode) สำหรับห้องควบคุมหรือการใช้งานต่อเนื่องโดยไม่แสบตา
- โครงสร้างตารางและใบรับบริการสามารถสลับเข้าสู่โหมดพิมพ์กระดาษ A4 (`@media print`) ได้ทันทีโดยที่ลายมือชื่อดิจิทัลไม่เพี้ยน

## Colors

ชุดสีเน้นความน่าเชื่อถือระดับวิชาชีพด้วยสีน้ำเงินโคบอลต์เป็นสีหลักสำหรับจุดปฏิบัติการสำคัญ บนพื้นหลังสีขาวกระดาษและสีเทาหินชนวนที่อ่านสบายตา

### Primary
- **Service Cobalt** (`#2563eb` / Dark Mode `#3b82f6`): ใช้สำหรับปุ่มคำสั่งหลัก (Primary CTA) สถานะเมนูที่กำลังเลือก และจุดเน้นของรหัสใบรับบริการ
- **Deep Cobalt** (`#1d4ed8`): ใช้สำหรับสถานะ Hover และ Active ของปุ่มหลัก

### Secondary
- **Verification Emerald** (`#059669` / Dark Mode `#10b981`): ใช้สำหรับสถานะการเชื่อมต่อฐานข้อมูล Google Sheets สำเร็จ ป้ายยืนยันการลงลายมือชื่อครบถ้วน และปุ่มส่งออกข้อมูล Excel/CSV

### Tertiary
- **Supervisor Amber** (`#d97706` / Dark Mode `#f59e0b`): ใช้สำหรับแจ้งเตือนสถานะโหมดสำรองข้อมูลในเครื่อง และการยืนยันสิทธิ์เจ้าหน้าที่ (PIN)
- **Alert Crimson** (`#dc2626` / Dark Mode `#ef4444`): ใช้สำหรับข้อความแจ้งเตือนข้อมูลไม่ครบถ้วนและการยืนยันการลบข้อมูลถาวร

### Neutral
- **Alabaster Canvas** (`#f8fafc` / Dark Mode `#020617`): พื้นหลังหลักของหน้าจอแอปพลิเคชัน
- **Ledger Paper Surface** (`#ffffff` / Dark Mode `#0f172a`): พื้นผิวของแบบฟอร์ม ตารางข้อมูล และหน้าต่างใบรับบริการ
- **Slate Ink Primary** (`#0f172a` / Dark Mode `#f8fafc`): สีตัวอักษรหลักสำหรับหัวข้อและเนื้อหาข้อมูล
- **Slate Ink Secondary** (`#475569` / Dark Mode `#94a3b8`): สีตัวอักษรรองสำหรับคำอธิบายประกอบและหมายเหตุ
- **Hairline Border** (`#e2e8f0` / Dark Mode `#1e293b`): เส้นแบ่งส่วนฟอร์มและตารางขนาด `1px`

### Named Rules
**The Single Primary Action Rule.** ในแต่ละหน้าจอจะมีปุ่มสีน้ำเงินเข้ม (`Service Cobalt`) เพียงปุ่มเดียวสำหรับคำสั่งหลักของหน้านั้น ปุ่มรองทั้งหมดต้องใช้พื้นผิวแบบ Outline หรือ Subtle เพื่อให้สายตามุ่งไปยังเป้าหมายหลักได้ทันที

## Typography

**Display Font:** IBM Plex Sans Thai (พร้อม Noto Sans Thai, Anuphan, Tahoma เป็นฟอนต์สำรอง)
**Body Font:** IBM Plex Sans Thai (400 Regular, 500 Medium, 600 SemiBold, 700 Bold)
**Label/Mono Font:** IBM Plex Sans Thai (`font-variant-numeric: tabular-nums`)

**Character:** มีโครงสร้างเรขาคณิตที่ทันสมัย หัวอักษรไทยชัดเจน อ่านง่ายในทุกขนาดหน้าจอ และมีระยะความสูงของสระบน–ล่างและวรรณยุกต์ที่สมดุลไม่ซ้อนทับกัน

### Hierarchy
- **Display** (`700 Bold`, `1.875rem` / `30px`, `line-height: 1.4`): หัวข้อหลักประจำหน้า
- **Headline** (`700 Bold`, `1.25rem` / `20px`, `line-height: 1.42`): ชื่อส่วนหลักของแบบฟอร์มและหัวตารางใบลงเวลา
- **Title** (`600 SemiBold`, `1rem` / `16px`, `line-height: 1.5`): ชื่อกลุ่มปฏิบัติงานและหัวข้อส่วนย่อย
- **Body** (`400 Regular`, `0.875rem` / `14px`–`16px`, `line-height: 1.65`): เนื้อหาทั่วไป ข้อมูลในตาราง และข้อความในช่องกรอกข้อมูล (ความยาวบรรทัดไม่เกิน `65–75ch`)
- **Label** (`600 SemiBold`, `0.75rem` / `12px`–`14px`, `line-height: 1.5`, `letter-spacing: 0.005em`): ป้ายกำกับช่องกรอกข้อมูลและป้ายสถานะ

### Named Rules
**The Thai Vowel Clearance Rule.** ห้ามใช้ `line-height` ต่ำกว่า `1.4` กับหัวข้อภาษาไทย และห้ามใช้ `fixed height` กับปุ่มหรือป้ายข้อความ เพื่อป้องกันไม่ให้วรรณยุกต์ไทย (่ ้ ๊ ๋) ถูกตัดขอบ

**The No-Kicker Rule.** ห้ามวางป้ายข้อความขนาดเล็ก (Eyebrow / Kicker) เหนือหัวข้อ `<h1>` หรือ `<h2>` ให้หัวข้อหลักทำหน้าที่สื่อสารด้วยตัวเองอย่างชัดเจน

## Layout

ใช้ระบบโครงสร้างกลางหน้าจอความกว้างสูงสุด `1280px` (`max-w-7xl`) สำหรับหน้าแดชบอร์ดและตารางข้อมูล และจำกัดความกว้างที่ `896px` (`max-w-4xl`) สำหรับหน้ากรอกแบบฟอร์มคำขอรับบริการเพื่อให้สายตากวาดอ่านจากซ้ายไปขวาได้รวดเร็ว

ระยะห่างใช้สเกลฐาน `4px` (`8px` สำหรับกลุ่มข้อมูลที่ผูกกัน, `16px` สำหรับช่องว่างระหว่างฟิลด์ในแถวเดียวกัน, และ `24px–32px` สำหรับแยกส่วนหลักของแบบฟอร์ม) บนหน้าจอมือถือและแท็บเล็ต โครงสร้างหลายคอลัมน์จะปรับเรียงเป็นคอลัมน์เดี่ยวตามลำดับการอ่านจริง

## Elevation & Depth

ระบบใช้การแยกชั้นด้วยสีพื้นผิวและเส้นขอบขนาด `1px` เป็นหลัก (Tonal & Hairline Layering) แทนการใช้เงาฟุ้งกระจาย เพื่อให้หน้าจอดูสะอาดและใกล้เคียงกับแบบฟอร์มเอกสารจริง เงาจะถูกใช้เฉพาะกับองค์ประกอบที่ลอยอยู่เหนือหน้าจอ เช่น หน้าต่างยืนยัน (Modal Dialog) เท่านั้น

### Shadow Vocabulary
- **Resting Surface** (`box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04)`): ใช้กับกรอบแบบฟอร์มหลัก
- **Floating Dialog** (`box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.18)`): ใช้กับหน้าต่างยืนยันและหน้าต่างพิมพ์ใบรับบริการ

### Named Rules
**The Flat-By-Default Rule.** พื้นผิวข้อมูลในระดับเดียวกันใช้เส้นแบ่ง `1px` แทนการซ้อนการ์ดที่มีเงาซ้ำซ้อน

## Shapes

- **Main Containers & Forms:** มุมโค้งขนาด `16px` (`rounded-2xl`) พร้อมเส้นขอบ `1px`
- **Inputs, Selects, Buttons & Checkboxes:** มุมโค้งขนาด `12px` (`rounded-xl`) ให้สัมผัสที่จับต้องได้และกดง่ายบนหน้าจอสัมผัส
- **Status Badges:** มุมโค้งขนาด `8px` (`rounded-lg`)

## Components

### Buttons
- **Shape:** มุมโค้ง `12px` (`rounded-xl`) ความสูงขั้นต่ำรองรับการสัมผัส (`min-h-[44px]` บนอุปกรณ์สัมผัส)
- **Primary:** พื้นหลังสี `#2563eb` ตัวอักษรสีขาว น้ำหนัก `600 SemiBold`
- **Hover / Focus:** เปลี่ยนพื้นหลังเป็น `#1d4ed8` พร้อมวงแหวนโฟกัส `focus-visible:ring-2 focus-visible:ring-blue-500/40`
- **Secondary / Outline:** พื้นหลังสีขาว เส้นขอบ `#cbd5e1` ตัวอักษรสี `#334155`

### Cards / Containers
- **Corner Style:** `16px` (`rounded-2xl`)
- **Background:** `#ffffff` ในโหมดสว่าง และ `#0f172a` ในโหมดมืด
- **Border:** `1px solid #e2e8f0` (โหมดสว่าง) / `1px solid #1e293b` (โหมดมืด)
- **Internal Padding:** `24px` ถึง `32px`

### Inputs / Fields
- **Style:** เส้นขอบ `1px solid #cbd5e1` พื้นหลัง `#ffffff` มุมโค้ง `12px` ขนาดตัวอักษร `16px` (`1rem`) บนมือถือเพื่อป้องกันไม่ให้เบราว์เซอร์ iOS ซูมหน้าจออัตโนมัติ
- **Focus:** เปลี่ยนเส้นขอบเป็น `#2563eb` พร้อมวงแหวนโฟกัสสีน้ำเงินโปร่งแสง
- **Error:** เส้นขอบสี `#dc2626` พร้อมข้อความอธิบายวิธีแก้ไขและไอคอนแจ้งเตือนด้านล่างที่ผูกด้วย `aria-describedby`

### Navigation
- แถบนำทางด้านบนแบบติดตรึง (`sticky top-0`) แสดงชื่อระบบ สถานะการเชื่อมต่อ Google Sheets ปุ่มสลับโหมดเจ้าหน้าที่ ปุ่มสลับโหมดสว่าง/มืด และแถบสลับหน้าแบบฟอร์มพร้อมตัวเลขจำนวนรายการ (`tabular-nums`)

### Digital Signature Pad (คอมโพเนนต์เฉพาะของระบบ)
- รองรับทั้งการวาดลายมือชื่อด้วยเมาส์/นิ้ว/ปากกาสไตลัสบน `<canvas>` (`touch-action: none`) และการอัปโหลดไฟล์รูปภาพลายมือชื่อ พร้อมปุ่มล้างลายเซ็นและป้ายสถานะยืนยันเมื่อลงชื่อเรียบร้อยแล้ว

## Do's and Don'ts

### Do:
- **Do** ใช้ฟอนต์ **IBM Plex Sans Thai** กับทุกองค์ประกอบรวมถึงตารางพิมพ์ขนาด A4
- **Do** ใช้ `<fieldset>` และ `<legend>` สำหรับกลุ่มตัวเลือกบริการแบบหลายรายการ (`✓`)
- **Do** กำหนดขนาดพื้นที่สัมผัสของปุ่มและตัวเลือกไม่ต่ำกว่า `44x44px` สำหรับการใช้งานบน iPad และสมาร์ตโฟน

### Don't:
- **Don't** ซ้อนการ์ดที่มีเส้นขอบและเงาไว้ภายในการ์ดอื่น (No Nested Cards)
- **Don't** วางข้อความ Eyebrow / Kicker เหนือหัวข้อหลัก
- **Don't** รวมแบบฟอร์มบันทึกเวลาของกลุ่มที่ 1, 2, และ 3 เข้าด้วยกัน — ต้องแยกเป็น 3 แบบฟอร์มและ 3 แผ่นงานอิสระเสมอ

