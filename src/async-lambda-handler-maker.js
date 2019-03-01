export default fn => {
  return (...params) =>
    fn(...params).catch(err => {
      console.log(err);
      return {
        statusCode: 500,
        body: JSON.stringify({ msg: err.message })
      };
    });
};

// export default fn => {
//   return async (...params) => {
//     try {
//       const result = await fn(...params);
//       return result;
//     } catch (err) {
//       return {
//         statusCode: 500,
//         body: JSON.stringify({ msg: err.message })
//       };
//     }
//   };
// };
