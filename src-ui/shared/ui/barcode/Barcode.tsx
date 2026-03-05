import { useBarcode } from 'next-barcode';

function Barcode() {
  const { inputRef } = useBarcode({
    value: 'next-barcode',
    options: {
      background: '#ccffff',
    }
  });

  return <svg ref={inputRef} />;
};

export default Barcode;

