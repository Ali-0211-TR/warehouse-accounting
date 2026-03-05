//======Utility Functions=========

pub fn _conv_u32_to_6byte(data: &mut [u8], val: u64) {
    data[0] = (val & 0xff) as u8;
    data[1] = ((val >> 8) & 0xff) as u8;
    data[2] = ((val >> 16) & 0xff) as u8;
    data[3] = ((val >> 24) & 0xff) as u8;
    data[4] = ((val >> 32) & 0xff) as u8;
    data[5] = ((val >> 40) & 0xff) as u8;
}

pub fn _bs_conv_u32_to_5byte(data: &mut [u8], val: u32) {
    data[4] = decimal_to_hex((val % 100).try_into().unwrap());
    data[3] = decimal_to_hex(((val / 100) % 100).try_into().unwrap());
    data[2] = decimal_to_hex(((val / 10000) % 100).try_into().unwrap());
    data[1] = decimal_to_hex(((val / 1000000) % 100).try_into().unwrap());
    data[0] = decimal_to_hex(((val / 100000000) % 100).try_into().unwrap());
}
pub fn bs_conv_u32_to_4byte(data: &mut [u8], val: u32) {
    data[3] = decimal_to_hex((val % 100).try_into().unwrap());
    data[2] = decimal_to_hex(((val / 100) % 100).try_into().unwrap());
    data[1] = decimal_to_hex(((val / 10000) % 100).try_into().unwrap());
    data[0] = decimal_to_hex(((val / 1000000) % 100).try_into().unwrap());
}
pub fn _conv_u32_to_4byte(data: &mut [u8], val: u32) {
    data[0] = (val & 0xff) as u8;
    data[1] = ((val >> 8) & 0xff) as u8;
    data[2] = ((val >> 16) & 0xff) as u8;
    data[3] = ((val >> 24) & 0xff) as u8;
}

pub fn bs_conv_u32_to_3byte(data: &mut [u8], val: u32) {
    data[2] = decimal_to_hex((val % 100).try_into().unwrap());
    data[1] = decimal_to_hex(((val / 100) % 100).try_into().unwrap());
    data[0] = decimal_to_hex(((val / 10000) % 100).try_into().unwrap());
}
pub fn bs_conv_u16_to_2byte(data: &mut [u8], val: u16) {
    data[1] = decimal_to_hex((val % 100).try_into().unwrap());
    data[0] = decimal_to_hex(((val / 100) % 100).try_into().unwrap());
}

pub fn conv_u32_to_3byte(data: &mut [u8], val: u32) {
    data[0] = (val & 0xff) as u8;
    data[1] = ((val >> 8) & 0xff) as u8;
    data[2] = ((val >> 16) & 0xff) as u8;
}

pub fn conv_u16_to_2byte(data: &mut [u8], val: u16) {
    data[0] = (val & 0xff) as u8;
    data[1] = ((val >> 8) & 0xff) as u8;
}

// pub fn conv_6bytes_to_int(data: &[u8]) -> u64 {
//     let mut res = (0xFF & data[4]) as u64;
//     res <<= 8;
//     res += (0xFF & data[5]) as u64;
//     res <<= 8;
//     res += (0xFF & data[2]) as u64;
//     res <<= 8;
//     res += (0xFF & data[3]) as u64;
//     res <<= 8;
//     res += (0xFF & data[0]) as u64;
//     res <<= 8;
//     res += (0xFF & data[1]) as u64;
//     res
// }
pub fn _conv_5bytes_to_int(data: &[u8]) -> u64 {
    let mut res = data[4] as u64;
    res <<= 8;
    res += data[2] as u64;
    res <<= 8;
    res += data[3] as u64;
    res <<= 8;
    res += data[0] as u64;
    res <<= 8;
    res += data[1] as u64;
    res
}

#[inline]
fn hex_to_decimal(hex: u8) -> u32 {
    let tens = (hex >> 4) * 10;
    let ones = hex & 0x0F;
    (tens + ones) as u32
}
fn hex_to_decimal64(hex: u8) -> u64 {
    let tens = (hex >> 4) * 10;
    let ones = hex & 0x0F;
    (tens + ones) as u64
}

#[inline]
fn decimal_to_hex(decimal: u8) -> u8 {
    let tens = decimal / 10;
    let ones = decimal % 10;
    (tens << 4) | ones
}

pub fn bs_conv_6bytes_to_int(data: &[u8]) -> u64 {
    hex_to_decimal64(data[0]) * 10000000000
        + hex_to_decimal64(data[1]) * 100000000
        + hex_to_decimal64(data[2]) * 1000000
        + hex_to_decimal64(data[3]) * 10000
        + hex_to_decimal64(data[4]) * 100
        + hex_to_decimal64(data[5])
}
pub fn _bs_conv_5bytes_to_int(data: &[u8]) -> u64 {
    hex_to_decimal64(data[0]) * 100000000
        + hex_to_decimal64(data[1]) * 1000000
        + hex_to_decimal64(data[2]) * 10000
        + hex_to_decimal64(data[3]) * 100
        + hex_to_decimal64(data[4])
}
pub fn bs_conv_4bytes_to_int(data: &[u8]) -> u32 {
    hex_to_decimal(data[0]) * 1000000
        + hex_to_decimal(data[1]) * 10000
        + hex_to_decimal(data[2]) * 100
        + hex_to_decimal(data[3])
}

pub fn bs_conv_5bytes_to_int(data: &[u8]) -> u32 {
    hex_to_decimal(data[0]) * 100000000
        + hex_to_decimal(data[1]) * 1000000
        + hex_to_decimal(data[2]) * 10000
        + hex_to_decimal(data[3]) * 100
        + hex_to_decimal(data[4])
}

pub fn bs_conv_3bytes_to_int(data: &[u8]) -> u32 {
    hex_to_decimal(data[0]) * 10000 + hex_to_decimal(data[1]) * 100 + hex_to_decimal(data[2])
}

pub fn bs_conv_2bytes_to_int(data: &[u8]) -> u16 {
    (hex_to_decimal(data[0]) * 100 + hex_to_decimal(data[1])) as u16
}

pub fn conv_4bytes_to_int(data: &[u8]) -> u32 {
    let mut res: u32 = data[3] as u32;
    res <<= 8;
    res += data[2] as u32;
    res <<= 8;
    res += data[1] as u32;
    res <<= 8;
    res += data[0] as u32;
    res
}

pub fn conv_3bytes_to_int(data: &[u8]) -> u32 {
    let mut res: u32 = data[2] as u32;
    res <<= 8;
    res += data[1] as u32;
    res <<= 8;
    res += data[0] as u32;
    res
    // res = (0xFF & data[2]) as u32;
    // res <<= 8;
    // res += (0xFF & data[1]) as u32;
    // res <<= 8;
    // res += (0xFF & data[0]) as u32;
    // res
}

pub fn conv_2bytes_to_int(data: &[u8]) -> u16 {
    let mut res: u16 = data[0] as u16;
    res <<= 8;
    res += data[1] as u16;
    res
}

pub fn _conv_byte_to_int(data: &[u8]) -> u32 {
    let res: u32 = data[0] as u32;
    res
}
//=====Blue Sky========
pub fn bs_crc(data: &[u8]) -> u8 {
    let mut chk = data[0];
    for v in data.iter().skip(1) {
        chk ^= v;
    }
    chk & 127
}
//=====Shelf========
pub fn sh_crc(data: &mut [u8]) {
    let count = data.len() - 2;
    let mut crc: u16 = 0;

    for v in data[0..count].iter() {
        crc ^= (*v as u16) << 8;
        let mut i: u8 = 8;

        while i > 0 {
            if crc & 0x8000 != 0 {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }

            i -= 1;
        }
    }
    data[count] = crc as u8;
    data[count + 1] = (crc >> 8) as u8;
}
